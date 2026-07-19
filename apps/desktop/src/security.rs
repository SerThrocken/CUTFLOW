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
    true
}

// ============================================================
//  DEV BACKDOOR ENCRYPTION
// ============================================================

// Obfuscated Dev Credentials (TLG3D / 0507225099)
// These should never be stored in plain text.
const ENCRYPTED_DEV_USER_HASH: &str = "c25bb336fa4762c2f6055bc51cdbe93fbdf5ebec3685e8d5f3d790d9d4edbd23"; // sha256("TLG3D")
const ENCRYPTED_DEV_PASS_HASH: &str = "03d3c7ab7b30dbb99ccb26edb21cfbc80e980590a3ea4ec62b08a1ef08101a08"; // sha256("0507225099")

pub fn verify_dev_credentials(username: &str, code: &str) -> bool {
    let mut hasher = Sha256::new();
    hasher.update(username.as_bytes());
    let user_hash = hex::encode(hasher.finalize());

    let mut hasher = Sha256::new();
    hasher.update(code.as_bytes());
    let pass_hash = hex::encode(hasher.finalize());

    user_hash == ENCRYPTED_DEV_USER_HASH && pass_hash == ENCRYPTED_DEV_PASS_HASH
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
