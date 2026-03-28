"use client"
import { useState } from "react"
import Wizard from "../components/Wizard"
import Dashboard from "../components/Dashboard"

export default function Home() {
  const [userId] = useState("user_" + Math.random().toString(36).substr(2, 9))
  const [profile, setProfile] = useState<any>(null)

  const handleProfileComplete = (p: any) => setProfile(p)

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {!profile ? (
        <Wizard userId={userId} onComplete={handleProfileComplete} />
      ) : (
        <Dashboard userId={userId} profile={profile} />
      )}
    </main>
  )
}