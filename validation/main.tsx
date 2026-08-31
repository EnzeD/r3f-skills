import { StrictMode, Suspense, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber'
import { Vector3 } from 'three'
import { examples } from '../.generated/examples'

declare global {
  interface Window {
    validation?: { state: RootState; frames: number }
  }
}

function Probe() {
  const state = useThree()
  useEffect(() => {
    window.validation = { state, frames: 0 }
    return () => { delete window.validation }
  }, [state])
  useFrame(() => {
    if (window.validation) window.validation.frames++
  })
  return null
}

function App() {
  const query = new URLSearchParams(location.search)
  const key = (query.get('skill') || 'r3f-shaders') as keyof typeof examples
  const entry = examples[key]
  const [mounted, setMounted] = useState(true)
  if (!entry) return <p>Unknown skill</p>
  const { Component, ownsCanvas } = entry
  const demand = key === 'r3f-animation'
  return (
    <>
      <nav>
        <label>Skill <select value={key} onChange={(event) => { location.search = `?skill=${event.target.value}` }}>
          {Object.keys(examples).map((name) => <option key={name}>{name}</option>)}
        </select></label>
        <button onClick={() => setMounted((value) => !value)}>{mounted ? 'Unmount' : 'Mount'}</button>
      </nav>
      <div id="scene">
        {ownsCanvas ? (mounted && <Component />) : (
          <Canvas
            camera={{ position: key === 'r3f-lighting' ? [4, 3, 6] : [0, 1, 6] }}
            dpr={1}
            shadows={key === 'r3f-lighting' ? 'percentage' : false}
            frameloop={demand ? 'demand' : 'always'}
            // Only the verification harness retains pixels for image assertions.
            gl={{ preserveDrawingBuffer: true }}
            onCreated={({ camera }) => { camera.lookAt(new Vector3(0, 0, 0)) }}
          >
            <color attach="background" args={['#101018']} />
            <Probe />
            {!['r3f-lighting', 'r3f-postprocessing'].includes(key) && <>
              <ambientLight intensity={0.5} />
              <directionalLight position={[3, 4, 5]} intensity={2} />
            </>}
            <Suspense fallback={null}>{mounted && <Component />}</Suspense>
          </Canvas>
        )}
      </div>
    </>
  )
}

const style = document.createElement('style')
style.textContent = 'body { margin: 0; background: #101018; color: white; font: 14px system-ui; } nav { height: 40px; display: flex; align-items: center; gap: 16px; padding: 0 12px; } #scene { width: 640px; height: 480px; } button, select { font: inherit; }'
document.head.append(style)
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
