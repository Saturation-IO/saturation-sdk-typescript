/**
 * Per-line bid justifications, keyed by account code.
 *
 * The public budget-document payload does not yet expose per-line notes, so a
 * winning bid writes its own. Because workspaces share a chart-of-accounts
 * numbering scheme (1000 Above-the-Line, 2000 Production, ...), the code is a
 * stable key across projects. When a workspace adds its own note to a line the
 * live value wins; these are the well-written fallback that makes the demo
 * feel finished out of the box.
 */
export const LINE_NOTES: Record<string, string> = {
  // Above-the-Line
  "1000":
    "The names and the pen. Locked before prep so every downstream department builds against signed commitments, not estimates.",
  "1001":
    "Final draft plus two paid revisions and a polish. Rights are fully chained through delivery.",
  "1002":
    "Full producing unit from prep through delivery. Covers the line producer's wrap week and the unit's wrap liability.",
  "1003":
    "Director's fee across prep, shoot, and the director's cut. Includes two weeks of prep and the standard post consultation.",
  "1004":
    "Principal cast, buyout for all media worldwide. Billing block and approvals settled at signature.",

  // Production
  "2000":
    "The shoot itself. Every working day is accounted for here, from first company move to final wrap.",
  "2001":
    "ADs, production office, and coordinators. The crew that keeps the day moving and the paper clean.",
  "2002":
    "Camera package, operators, and media management. Includes a second body for stunt and splinter days.",
  "2003":
    "Grip and electric package with a full condor order for night exteriors. Rig and strike days are carried separately.",
  "2004":
    "Art department builds and dressing. Practical environments over CG wherever the frame allows.",
  "2005":
    "Set construction for the two stage builds. Lumber, labor, and strike, with a contingency for one redesign.",
  "2006":
    "Wardrobe, multiples for stunt and blood work, and aging. Hero costumes are duplicated for the second unit.",
  "2007":
    "Makeup and hair, including prosthetics application on the days the script calls for it.",
  "2008":
    "Location fees, permits, and the company moves between them. The desert unit is priced as a full distant location.",
  "2009":
    "Picture vehicles, cast and crew transport, and the fuel line that keeps a moving company fed.",
  "2010":
    "Catering and craft services for the full company, per head, per day. Hot meals on night shoots.",

  // Post
  "3000":
    "Everything after the camera stops. Editorial, VFX, music, sound, and the finish.",
  "3001":
    "Editorial through picture lock. Includes the editor's kit, assistant editors, and a screening room.",
  "3002":
    "Visual effects for the hero sequences. Priced per shot against the current breakdown, with a vendor already attached.",
  "3003":
    "Original score, musicians, and the mix. Covers one orchestral session and full stems for delivery.",
  "3004":
    "Dialogue, ADR, sound design, and the final re-recording mix. Atmos deliverable included.",
  "3005":
    "Color correction and online finishing. Supervised grade with the DP, then all masters and versioning.",

  // Other
  "4000":
    "The protections and the overhead. Not on screen, but the production does not run without them.",
  "4001":
    "Production insurance: cast, negative, equipment, and general liability for the full schedule.",
  "4002":
    "Legal for chain-of-title and contracts, plus production accounting through final trial balance.",
  "4003":
    "General overhead and contingency held against the unknowns every schedule carries.",
};

export function noteFor(code: string | null | undefined): string | null {
  if (!code) return null;
  return LINE_NOTES[code] ?? null;
}
