// Template: Rate Limit Check FIRST
// Use in: src/pages/register.jsx or src/components/form/FileUpload.jsx
// Rule 1: Rate limit check MUST happen before any file upload

async function handleFileUpload(file, fileType) {
  try {
    // STEP 1: Rate limit check — MUST be first
    const userId = getCurrentUserId(); // or null if anonymous
    const isRateLimited = await rateLimiter.checkUploadLimit(userId);
    
    if (isRateLimited) {
      setError('Too many uploads. Please try again in 5 minutes.');
      return; // Exit early — do not proceed to any file operations
    }

    // STEP 2: Type validation
    if (file.type !== 'application/pdf') {
      setError(`${fileType} must be a PDF.`);
      return;
    }

    // STEP 3: Size validation
    const maxSize = fileType === 'resume' ? 400 * 1024 : 100 * 1024;
    if (file.size > maxSize) {
      const maxLabel = fileType === 'resume' ? '400KB' : '100KB';
      setError(`${fileType} must be under ${maxLabel}.`);
      return;
    }

    // STEP 4: Upload (only after rate limit passes)
    const uploadPath = `registrants/${userId}/${fileType}-${Date.now()}.pdf`;
    const downloadUrl = await storageService.uploadFile(file, uploadPath);
    
    // Store URL in Firestore (already validated by storageService)
    await userService.updateUserFile(userId, fileType, downloadUrl);
    
    setSuccess(`${fileType} uploaded successfully.`);
    
  } catch (error) {
    setError('Upload failed. Please try again.');
    console.error(error);
  }
}
