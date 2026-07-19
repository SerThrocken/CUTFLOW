use sha2::{Sha256, Digest};
use std::time::{SystemTime, UNIX_EPOCH};

// ============================================================
//  LICENSE AND TRIAL MANAGEMENT
// ============================================================

/// Get a unique hardware identifier based on machine ID to prevent trial abuse.
pub fn get_hardware_id() -> String {
    let mut hasher = Sha256::new();
    
    // In a real application, you would pull actual hardware IDs (MAC, CPU ID, Volume Serial).
    // For this example we use a combination of OS environment variables as a proxy.
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let username = std::env::var("USERNAME").unwrap_or_else(|_| "unknown".into());
    let computer_name = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "unknown".into());
    
    hasher.update(format!("{}-{}-{}-{}", os, arch, username, computer_name).as_bytes());
    
    let result = hasher.finalize();
    hex::encode(result)
}

/// Checks if the user is currently within a 7-day Pro Trial based on hardware ID.
pub fn is_trial_valid() -> bool {
    // In production, this would verify against a secure local file or server backend.
    // For now, we simulate a check based on the hardware ID.
    let hw_id = get_hardware_id();
    
    // Simulate a check if the current time is within 7 days of the trial start.
    // A production implementation would fetch the stored trial start time.
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    // Assuming trial starts when the hardware ID is first seen and stored locally.
    // Here we just return true for the sake of the demo, but this is where
    // you would check `now - trial_start_time <= 7 * 24 * 60 * 60`.
    // you would check `now - trial_start_time <= 7 * 24 * 60 * 60`.
    true
}

use serde::{Serialize, Deserialize};
use std::fs::File;
use std::io::{Read, Write};

const LICENSE_SERVER_URL: &str = "https://cutflow-licensing.vercel.app";

#[derive(Serialize, Deserialize, Debug, Clone)]
struct LocalLicense {
    license_key: String,
    tier: String,
    validated_at: u64,
}

/// Contacts the Vercel license server to validate a license key.
pub async fn validate_license_online(license_key: &str) -> Result<String, String> {
    let hw_id = get_hardware_id();
    let client = reqwest::Client::new();
    
    let response = client.post(format!("{}/api/license/verify", LICENSE_SERVER_URL))
        .json(&serde_json::json!({
            "license_key": license_key,
            "hardware_id": hw_id,
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if response.status() == 200 {
        let body: serde_json::Value = response.json().await.map_err(|_| "Invalid response format")?;
        if body["status"] == "active" {
            let tier = body["tier"].as_str().unwrap_or("free").to_string();
            
            // Cache locally
            let local_lic = LocalLicense {
                license_key: license_key.to_string(),
                tier: tier.clone(),
                validated_at: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            };
            if let Ok(mut file) = File::create("license.json") {
                if let Ok(json) = serde_json::to_string(&local_lic) {
                    let _ = file.write_all(json.as_bytes());
                }
            }
            return Ok(tier);
        }
    }
    
    Err("Invalid or inactive license key".to_string())
}

/// Checks if the user has an active Pro license or valid trial.
pub fn is_pro_active() -> bool {
    // 1. Backdoor checks
    if option_env!("DEV_USER_HASH").is_some() {
        // If we are compiling in development mode with local credentials, bypass
        // (For the backdoor demo login MAMAMEG/TLG3D checks, those bypass locally)
    }

    // 2. Local cache check
    if let Ok(mut file) = File::open("license.json") {
        let mut contents = String::new();
        if file.read_to_string(&mut contents).is_ok() {
            if let Ok(local_lic) = serde_json::from_str::<LocalLicense>(&contents) {
                // Ensure cached verification is within 30 days (offline tolerance)
                let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
                if now - local_lic.validated_at < 30 * 24 * 60 * 60 {
                    return local_lic.tier == "pro" || local_lic.tier == "studio";
                }
            }
        }
    }

    // 3. Fallback to trial validation
    is_trial_valid()
}

// ============================================================
//  DEV BACKDOOR ENCRYPTION
// ============================================================

// The actual hashes are securely loaded from a local .env file during compilation.
// This ensures that the GitHub source code does not contain the actual hashes or PINs.
const ENCRYPTED_DEV_USER_HASH: Option<&'static str> = option_env!("DEV_USER_HASH");
const ENCRYPTED_DEV_PASS_HASH: Option<&'static str> = option_env!("DEV_PASS_HASH");
const ENCRYPTED_DEV_USER_2_HASH: Option<&'static str> = option_env!("DEV_USER_2_HASH");
const ENCRYPTED_DEV_PASS_2_HASH: Option<&'static str> = option_env!("DEV_PASS_2_HASH");

pub fn verify_dev_credentials(username: &str, code: &str) -> bool {
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes());
    let user_hash = hex::encode(hasher.finalize());

    let mut hasher = Sha256::new();
    hasher.update(code.as_bytes());
    let pass_hash = hex::encode(hasher.finalize());

    let is_primary = Some(user_hash.as_str()) == ENCRYPTED_DEV_USER_HASH 
                  && Some(pass_hash.as_str()) == ENCRYPTED_DEV_PASS_HASH;
                  
    let is_secondary = Some(user_hash.as_str()) == ENCRYPTED_DEV_USER_2_HASH 
                    && Some(pass_hash.as_str()) == ENCRYPTED_DEV_PASS_2_HASH;

    is_primary || is_secondary
}

// ============================================================
//  MEMORY OBFUSCATION
// ============================================================

/// Struct to securely hold sensitive keys in memory by obfuscating them with XOR
/// until they are needed, mitigating memory scanning attacks.
pub struct ObfuscatedString {
    data: Vec<u8>,
    key: u8,
}

impl ObfuscatedString {
    pub fn new(cleartext: &str) -> Self {
        // Generate a random XOR key (fallback 42 if rand not present, but let's use standard time for now to avoid pulling rand)
        let key = (SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_micros() % 255) as u8;
        
        let mut data = cleartext.as_bytes().to_vec();
        for byte in data.iter_mut() {
            *byte ^= key;
        }
        
        Self { data, key }
    }

    pub fn reveal(&self) -> String {
        let mut clear_data = self.data.clone();
        for byte in clear_data.iter_mut() {
            *byte ^= self.key;
        }
        String::from_utf8(clear_data).unwrap_or_default()
    }
}
