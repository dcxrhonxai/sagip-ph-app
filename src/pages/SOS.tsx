import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SOSAlert({ userId }: { userId: string }) {
  const [situation, setSituation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const sendSOS = async () => {
    if (latitude === null || longitude === null) {
      setMessage('Location not available.')
      return
    }

    const { data, error } = await supabase.from('emergency_alerts').insert([
      {
        user_id: userId,
        emergency_type: 'SOS',
        situation,
        latitude,
        longitude,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ])

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Emergency alert sent successfully!')
    }
  }

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
      },
      err => setMessage('Unable to get location: ' + err.message)
    )
  }

  return (
    <div>
      <h1>SOS Emergency Alert</h1>
      <button onClick={getLocation}>Get Current Location</button>
      <textarea
        placeholder="Describe your situation"
        value={situation}
        onChange={e => setSituation(e.target.value)}
      />
      <button onClick={sendSOS}>Send SOS</button>
      <p>{message}</p>
    </div>
  )
}
