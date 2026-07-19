// ===== SYSTEM DETECTION MODULE =====

export interface SystemInfo {
  gpuVram: number;
  gpuName: string;
  cpuGeneration: string;
  cpuCores: number;
  ramAvailable: number;
  totalRam: number;
  osType: 'windows' | 'macos' | 'linux';
  osVersion: string;
  diskSpace: number;
  isSupported: boolean;
  supportLevel: 'minimum' | 'recommended' | 'optimal';
}

export class SystemDetector {
  /**
   * Detect GPU VRAM using WebGL
   */
  static detectGPUVram(): { vram: number; gpuName: string } {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

      if (!gl) {
        return { vram: 0, gpuName: 'Unknown' };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const gpuName = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'Unknown GPU';

      // Estimate VRAM based on GPU name
      let vram = 4;
      if (gpuName.includes('3060')) vram = 12;
      if (gpuName.includes('3070')) vram = 8;
      if (gpuName.includes('3080')) vram = 10;
      if (gpuName.includes('3090')) vram = 24;
      if (gpuName.includes('4060')) vram = 8;
      if (gpuName.includes('4070')) vram = 12;
      if (gpuName.includes('4080')) vram = 16;
      if (gpuName.includes('4090')) vram = 24;
      if (gpuName.includes('A100')) vram = 40;
      if (gpuName.includes('A6000')) vram = 48;

      return { vram, gpuName };
    } catch (error) {
      console.warn('GPU detection failed:', error);
      return { vram: 0, gpuName: 'Unknown' };
    }
  }

  /**
   * Detect CPU info
   */
  static detectCPU(): { generation: string; cores: number } {
    try {
      const cores = navigator.hardwareConcurrency || 8;

      // Parse from user agent
      let generation = 'Unknown';
      const ua = navigator.userAgent.toLowerCase();

      if (ua.includes('intel')) {
        generation = 'Intel (Detected)';
      } else if (ua.includes('amd')) {
        generation = 'AMD Ryzen (Detected)';
      }

      return { generation, cores };
    } catch (error) {
      console.warn('CPU detection failed:', error);
      return { generation: 'Unknown', cores: 8 };
    }
  }

  /**
   * Detect available RAM
   */
  static detectRAM(): { available: number; total: number } {
    try {
      // Estimate from performance API if available
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const availableGB = Math.round(memory.jsHeapSizeLimit / 1073741824);
        return { available: availableGB, total: availableGB * 1.5 };
      }
      return { available: 16, total: 16 };
    } catch (error) {
      console.warn('RAM detection failed:', error);
      return { available: 16, total: 16 };
    }
  }

  /**
   * Detect OS
   */
  static detectOS(): { osType: 'windows' | 'macos' | 'linux'; osVersion: string } {
    const ua = navigator.userAgent.toLowerCase();
    let osType: 'windows' | 'macos' | 'linux' = 'linux';
    let osVersion = 'Unknown';

    if (ua.includes('win')) {
      osType = 'windows';
      osVersion = ua.includes('windows nt 10') ? 'Windows 10+' : 'Windows';
    } else if (ua.includes('mac')) {
      osType = 'macos';
      osVersion = ua.includes('intel') ? 'macOS (Intel)' : 'macOS (Apple Silicon)';
    } else if (ua.includes('linux')) {
      osType = 'linux';
      osVersion = 'Linux';
    }

    return { osType, osVersion };
  }

  /**
   * Full system detection
   */
  static async detectSystem(): Promise<SystemInfo> {
    const gpu = this.detectGPUVram();
    const cpu = this.detectCPU();
    const ram = this.detectRAM();
    const os = this.detectOS();

    // Determine support level
    let supportLevel: 'minimum' | 'recommended' | 'optimal' = 'minimum';
    if (gpu.vram >= 12 && ram.available >= 32) {
      supportLevel = 'optimal';
    } else if (gpu.vram >= 8 && ram.available >= 16) {
      supportLevel = 'recommended';
    }

    const isSupported = gpu.vram >= 8 && ram.available >= 16;

    return {
      gpuVram: gpu.vram,
      gpuName: gpu.gpuName,
      cpuGeneration: cpu.generation,
      cpuCores: cpu.cores,
      ramAvailable: ram.available,
      totalRam: ram.total,
      osType: os.osType,
      osVersion: os.osVersion,
      diskSpace: 0, // Would require backend API
      isSupported,
      supportLevel,
    };
  }

  /**
   * Get recommended models based on system
   */
  static getRecommendedModels(system: SystemInfo): string[] {
    const models: string[] = [];

    if (system.supportLevel === 'optimal') {
      models.push('mistral:7b', 'llama2:13b', 'llava:7b');
    } else if (system.supportLevel === 'recommended') {
      models.push('mistral:7b', 'neural-chat:7b');
    } else {
      models.push('phi:2');
    }

    return models;
  }

  /**
   * Get warning messages for unsupported systems
   */
  static getWarnings(system: SystemInfo): string[] {
    const warnings: string[] = [];

    if (system.gpuVram < 8) {
      warnings.push(
        `⚠️ GPU VRAM is ${system.gpuVram}GB. At least 8GB is required, and 12GB+ is recommended for optimal speed.`
      );
    }

    if (system.ramAvailable < 16) {
      warnings.push(`⚠️ System RAM is ${system.ramAvailable}GB. 16GB+ is required (32-64GB recommended).`);
    }

    if (!system.isSupported) {
      warnings.push('⚠️ Your system does not meet the minimum requirements (16GB RAM / 8GB VRAM).');
    }

    return warnings;
  }
}

export default SystemDetector;
