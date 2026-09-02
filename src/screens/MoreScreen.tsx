import { useState } from 'react'
import { Layout } from '../components/Layout.tsx'
import { useStore } from '../state/context.ts'

export function MoreScreen() {
  const { state, dispatch } = useStore()
  const [appName, setAppName] = useState(state.appName)
  const [confirm, setConfirm] = useState(false)

  return (
    <Layout
      title="More"
      subtitle="Local only. Nothing is sent to a server."
      back={{ label: state.appName, href: '#/unused' }}
    >
      <section className="card">
        <h2>App name</h2>
        <p className="card-copy">Working title is Hives. Rename it if you like.</p>
        <label className="field tight">
          <span>Name</span>
          <input
            value={appName}
            onChange={(event) => setAppName(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button
          className="secondary"
          type="button"
          onClick={() => dispatch({ type: 'rename-app', name: appName })}
        >
          Save name
        </button>
      </section>

      <section className="card">
        <h2>Add a kit type</h2>
        <p className="card-copy">
          Built-in types cover Langstroth boxes, frames, boards, lids and feeders. Add another type only if you need to count it.
        </p>
        <a className="secondary link-btn" href="#/kit/new">
          Add a type
        </a>
      </section>

      <section className="card">
        <h2>Starting point</h2>
        <p className="card-copy">
          Replace everything in this browser with the starting point: 20 unused deep boxes, 20 unused shallow boxes, 5 spare metal lids (7 more on the L-yard full-size hives), three frame lots of 50, the three sites, and stacks only where they were given.
        </p>
        {confirm ? (
          <div className="confirm">
            <p>This cannot be undone.</p>
            <button
              className="danger"
              type="button"
              onClick={() => {
                dispatch({ type: 'reset-seed' })
                setConfirm(false)
                window.location.hash = '#/unused'
              }}
            >
              Reset to starting point
            </button>
            <button className="text-btn" type="button" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="danger-text" type="button" onClick={() => setConfirm(true)}>
            Reset to starting point
          </button>
        )}
      </section>
    </Layout>
  )
}
