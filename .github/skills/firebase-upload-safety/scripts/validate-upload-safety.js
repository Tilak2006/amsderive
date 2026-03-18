#!/usr/bin/env node

/**
 * Validation Script: Firebase Upload Safety
 * Scans AMS DERIVE registration codebase for security rule violations.
 * 
 * Usage: node validate-upload-safety.js
 */

const fs = require('fs');
const path = require('path');

const RULES = {
  RATE_LIMIT_FIRST: 'rate-limit-must-happen-before-upload',
  NO_COMPRESSION: 'never-compress-files-before-upload',
  ADMIN_404: 'admin-endpoints-return-404-not-500',
  EMAIL_LOWERCASE: 'email-checks-case-insensitive',
  URL_VALIDATION: 'validate-storage-urls-before-firestore',
  IP_FINGERPRINT: 'ip-rate-limiting-includes-user-agent',
};

const TARGET_FILES = [
  'src/firebase/storageService.js',
  'src/pages/register.jsx',
  'src/components/form/FileUpload.jsx',
  'src/lib/rateLimiter.js',
];

const VIOLATIONS = {
  [RULES.NO_COMPRESSION]: {
    patterns: [
      /compressFile\s*\(/,
      /gzip\s*\(/,
      /deflate\s*\(/,
      /compress-file/,
      /pako\.gzip/,
    ],
    severity: 'CRITICAL',
    meaning: 'Found compression utility call in upload flow',
  },
  [RULES.RATE_LIMIT_FIRST]: {
    patterns: [
      /uploadFile\s*\(.*?\)\s*\.\s*then|await uploadFile/,
      /firebase\.storage|storageService\.uploadFile/,
    ],
    shouldPrecede: [
      /checkUploadRateLimit|isRateLimited|rateLimit\.check/,
    ],
    severity: 'CRITICAL',
    meaning: 'Upload happens without rate limit check first',
  },
  [RULES.EMAIL_LOWERCASE]: {
    patterns: [/email\s*===|email\.includes|findUserByEmail/],
    shouldInclude: [/\.toLowerCase|\.toLowerCase\(\)|toLowerCase/],
    severity: 'HIGH',
    meaning: 'Email comparison not case-insensitive',
  },
  [RULES.URL_VALIDATION]: {
    patterns: /storageUrl|storage.*url/i,
    shouldInclude: /validateUrl|isValidUrl|url\.startsWith|https:\/\//,
    severity: 'HIGH',
    meaning: 'Storage URL not validated before storing',
  },
  [RULES.ADMIN_404]: {
    patterns: /throw new Error|response\.status\(500\)|res\.status\(500\)/,
    shouldInclude: /404|not found|not configured/i,
    severity: 'HIGH',
    meaning: 'Admin endpoint returns 500 instead of 404',
  },
  [RULES.IP_FINGERPRINT]: {
    patterns: /req\.ip|getUserIp|client.*ip/i,
    shouldInclude: /user.?agent|fingerprint|hash/i,
    severity: 'MEDIUM',
    meaning: 'IP rate limiting without user-agent fingerprinting',
  },
};

function scanFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, violations: [] };
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const violations = [];

  for (const [ruleKey, rule] of Object.entries(VIOLATIONS)) {
    if (rule.patterns) {
      const patternArray = Array.isArray(rule.patterns) ? rule.patterns : [rule.patterns];
      for (const pattern of patternArray) {
        if (pattern.test(content)) {
          // Found pattern; check if it should be preceded/included with another pattern
          if (rule.shouldPrecede) {
            const hasPrecursor = rule.shouldPrecede.some(p => p.test(content));
            if (!hasPrecursor) {
              violations.push({
                rule: ruleKey,
                severity: rule.severity,
                meaning: rule.meaning,
                file: filePath,
              });
            }
          } else if (rule.shouldInclude) {
            const hasInclusion = rule.shouldInclude.test(content);
            if (!hasInclusion) {
              violations.push({
                rule: ruleKey,
                severity: rule.severity,
                meaning: rule.meaning,
                file: filePath,
              });
            }
          }
        }
      }
    }
  }

  return { exists: true, violations };
}

function main() {
  console.log('🔍  Firebase Upload Safety Validation\n');
  console.log('Scanning files for security rule violations...\n');

  let totalViolations = 0;
  const results = {};

  for (const file of TARGET_FILES) {
    const { exists, violations } = scanFile(file);
    results[file] = { exists, violations };

    if (!exists) {
      console.log(`⚠️  ${file} — NOT FOUND`);
    } else if (violations.length === 0) {
      console.log(`✓ ${file} — PASS`);
    } else {
      console.log(`✗ ${file} — ${violations.length} violation(s):`);
      violations.forEach(v => {
        console.log(`   [${v.severity}] ${v.meaning}`);
        console.log(`      → Rule: ${v.rule}`);
      });
      totalViolations += violations.length;
    }
  }

  console.log('\n---\n');
  if (totalViolations === 0) {
    console.log('✓ All rules passed!\n');
  } else {
    console.log(`✗ Found ${totalViolations} violation(s). See templates/ for fixes.\n`);
  }

  console.log('Next steps:');
  console.log('1. Review each violation above');
  console.log('2. Use templates/ to implement fixes');
  console.log('3. Re-run this script to verify');
}

main();
