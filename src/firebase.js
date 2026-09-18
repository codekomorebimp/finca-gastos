import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAB7sHj6WjEmRKfThq7V9Pf5obeYzX9VJo",
  authDomain: "finca-jfm.firebaseapp.com",
  projectId: "finca-jfm",
  storageBucket: "finca-jfm.firebasestorage.app",
  messagingSenderId: "910224204673",
  appId: "1:910224204673:web:2784d3e6508d1f5f993e80"
}

const app = initializeApp(firebaseConfig)
export const db      = getFirestore(app)
export const storage = getStorage(app)
