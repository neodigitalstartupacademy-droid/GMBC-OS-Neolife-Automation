import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Rocket, Box } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/spreadsheets');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const initialUser = {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || 'Distributor',
          photoURL: user.photoURL,
          referralCode: user.uid.slice(0, 8),
          role: 'user',
          createdAt: new Date().toISOString(),
          googleAccessToken: accessToken || '',
        };
        // Create initial profile
        await setDoc(userDocRef, initialUser);
      } else {
        // Update token
        await setDoc(userDocRef, {
          googleAccessToken: accessToken || '',
        }, { merge: true });
      }

      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/login');
      setError('Échec de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Bon retour</h1>
        <p className="text-slate-600 mb-10">Accédez à votre tableau de bord Neo Digital System et gérez votre entreprise.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
        >
          {isLoading ? (
             <Box className="w-6 h-6 animate-spin text-blue-600" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              <span>Continuer avec Google</span>
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-slate-400">
          En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité. Seuls les distributeurs NeoLife autorisés doivent accéder à ce portail.
        </p>
      </motion.div>
    </div>
  );
}
