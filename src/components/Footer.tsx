import { ArrowUpRight, Mail } from 'lucide-react'
import { campusEdges, campusNodes, SAMPLE_DATA_NOTE } from '../data/campusGraph'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Logo />
          <p>
            An interactive all-pairs shortest-path explorer for the college campus,
            built around the Floyd–Warshall algorithm.
          </p>
          <span className="footer-credit">
            <span className="status-dot" aria-hidden="true" />
            AOA laboratory project
          </span>
        </div>

        <div className="footer-column footer-model">
          <h2>The model</h2>
          <p>
            <strong>{campusNodes.length}</strong> locations,{' '}
            <strong>{campusEdges.length}</strong> walkable connections.
          </p>
          <p>
            All-pairs matrix: <span className="mono">{campusNodes.length} × {campusNodes.length}</span>
          </p>
          <a href="mailto:student@college.edu" className="footer-mail">
            <Mail size={14} aria-hidden="true" />
            Project contact
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{SAMPLE_DATA_NOTE}</p>
        <p className="footer-acknowledgement">
          Analysis of Algorithms <span aria-hidden="true">·</span> CampusPath
          <ArrowUpRight size={13} aria-hidden="true" />
        </p>
      </div>
    </footer>
  )
}
