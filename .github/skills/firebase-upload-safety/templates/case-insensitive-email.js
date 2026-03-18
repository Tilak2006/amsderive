// Template: Case-Insensitive Email Deduplication
// Use in: src/pages/register.jsx or backend validators
// Rule 4: Email duplicate checks must be case-insensitive (normalize to lowercase)

async function checkEmailExists(email) {
  // ❌ WRONG: Case-sensitive
  // const exists = await db.collection('users').where('email', '==', email).get();
  // User can register both "john@example.com" and "John@Example.com"

  // ✓ CORRECT: Always normalize to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  
  const querySnapshot = await db
    .collection('users')
    .where('emailLower', '==', normalizedEmail) // Store lowercase copy
    .get();

  return !querySnapshot.empty;
}

async function registerUser(email, password, other) {
  try {
    // Normalize email immediately
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicates (case-insensitive)
    const exists = await checkEmailExists(normalizedEmail);
    if (exists) {
      throw new Error('Email already registered.'); // User-friendly
    }

    // Create user with normalized email
    const userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName: other.name,
    });

    // Store in Firestore with both copies for flexibility
    await db.collection('users').doc(userRecord.uid).set({
      email: normalizedEmail,           // Primary
      emailLower: normalizedEmail,      // Index copy (same in this case)
      emailNormalized: true,
      name: other.name,
      createdAt: new Date(),
    });

    return userRecord;

  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// In form component
export function RegistrationForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.toLowerCase(); // Normalize early
    const password = passwordInput.value;

    try {
      await registerUser(email, password, { name: nameInput.value });
      // Success
    } catch (err) {
      if (err.message.includes('already registered')) {
        setError('This email is already in use.');
      } else {
        setError('Registration failed.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value.toLowerCase())}
        placeholder="Email"
      />
      {/* ... rest of form */}
    </form>
  );
}
