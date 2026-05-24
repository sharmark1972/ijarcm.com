const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
require('dotenv').config();

const s3Client = new AWS.S3({
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  region: 'auto',
});

const uploadsDir = path.join(__dirname, '../uploads');
const publicUploadsDir = path.join(__dirname, '../public/uploads');

function collectFilesRecursively(dir) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...collectFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results;
}

async function uploadFilesFromDirectory(dir, keyPrefix = '') {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Directory not found: ${dir}`);
    return [];
  }

  const uploadedFiles = [];
  const files = collectFilesRecursively(dir);

  for (const filePath of files) {
    const stat = fs.statSync(filePath);

    if (!stat.isFile()) continue;

    try {
      const fileContent = fs.readFileSync(filePath);
      const relativePath = path.relative(dir, filePath).split(path.sep).join('/');
      const key = keyPrefix ? `${keyPrefix}/${relativePath}` : relativePath;

      await s3Client.putObject({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: 'application/octet-stream',
      }).promise();

      const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
      uploadedFiles.push({
        localPath: relativePath,
        r2Url: publicUrl,
      });

      console.log(`✅ Uploaded: ${relativePath}`);
    } catch (error) {
      const relativePath = path.relative(dir, filePath).split(path.sep).join('/');
      console.error(`❌ Error uploading ${relativePath}:`, error.message);
    }
  }

  return uploadedFiles;
}

async function migrateAllFiles() {
  console.log('🚀 Starting migration to Cloudflare R2...\n');

  try {
    const uploadedFromRoot = await uploadFilesFromDirectory(uploadsDir);
    const uploadedFromPublic = await uploadFilesFromDirectory(publicUploadsDir);

    const allFiles = [...uploadedFromRoot, ...uploadedFromPublic];

    console.log('\n✅ Migration Complete!');
    console.log(`📊 Total files uploaded: ${allFiles.length}`);

    if (allFiles.length > 0) {
      fs.writeFileSync(
        path.join(__dirname, '../migration-log.json'),
        JSON.stringify(allFiles, null, 2)
      );
      console.log('📝 Migration log saved to: migration-log.json');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateAllFiles();
