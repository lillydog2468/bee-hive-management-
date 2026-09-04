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
        <h2>Analytics</h2>
        <p className="card-copy">
          Charts from inspections, syrup, splits, unused kit and hives per yard.
          Empty until you log something.
        </p>
        <a className="secondary link-btn" href="#/analytics">
          Open analytics
        </a>
      </section>

      <section className="card">
        <h2>Add a kit type</h2>
        <p className="card-copy">
          Add a type from each section on Unused kit — hive boxes, frames, tops
          and bottoms, or other. Name, owned count, and an optional photo.
          Delete anything you do not want.
        </p>
        <a className="secondary link-btn" href="#/unused">
          Open unused kit
        </a>
      </section>

      <section className="card">
        <h2>Starting point</h2>
        <p className="card-copy">
          Replace everything in this browser with the starting point: 20 unused deep boxes, 20 unused shallow boxes, 5 spare metal lids, 2 spare bottom boards, 2 spare inner covers, 50 deep used frames, 50 waxed ready for spring (mixed deep/shallow, no split), 50 unbuilt ready for spring (mix pending more detail), Keith’s L-yard drawing, the garage pads, and the far-side nuc. Starter types can all be deleted. Types not counted yet stay at 0.
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
