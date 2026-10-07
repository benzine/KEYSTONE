/**
 * Cinematic image mapper — ported from the original single-file page.
 * Maps content seeds to localized images served from /public/images.
 *
 * The `/images/real/` set is real photography sourced via image search
 * (team portraits, case-study exteriors, client lifestyle shots, studio).
 */

const KC_IMG: Record<string, string> = {
  /* Hero & large cinematic shots */
  "keystone-dawn": "/images/ec7229f99a424e5f82159c106b293416.jpeg",
  "keystone-dusk": "/images/f11d2a4b09484de5828ee177c3be67fd.jpeg",
  /* Case study hero images — real architectural photography */
  "keystone-meridian-hero": "/images/real/case-meridian-1.jpg",
  "keystone-travertine-hero": "/images/real/case-travertine-1.jpg",
  "keystone-longfield-hero": "/images/real/case-longfield-1.jpg",
  "keystone-cascadia-hero": "/images/real/case-cascadia-1.jpg",
  "keystone-fenwick-hero": "/images/real/case-fenwick-1.jpg",
  "keystone-solstice-hero": "/images/real/case-solstice-1.jpg",
  /* Case study gallery alternates */
  "keystone-meridian-g1": "/images/real/case-meridian-1.jpg",
  "keystone-meridian-g2": "/images/real/case-meridian-2.jpg",
  "keystone-meridian-g3": "/images/61726f535b24412fb7c47a9482e11188.jpeg",
  "keystone-travertine-g1": "/images/real/case-travertine-1.jpg",
  "keystone-travertine-g2": "/images/215c780b6be547a4830cfe92998d17a2.jpeg",
  "keystone-travertine-g3": "/images/93b180fd558b4445ad81e5c4caf6a47f.jpeg",
  "keystone-longfield-g1": "/images/real/case-longfield-1.jpg",
  "keystone-longfield-g2": "/images/real/case-longfield-2.jpg",
  "keystone-longfield-g3": "/images/ff0593acdff04eea84696a1fa98a2001.jpeg",
  "keystone-cascadia-g1": "/images/real/case-cascadia-1.jpg",
  "keystone-cascadia-g2": "/images/real/case-cascadia-2.jpg",
  "keystone-cascadia-g3": "/images/real/case-cascadia-3.jpg",
  "keystone-fenwick-g1": "/images/real/case-fenwick-1.jpg",
  "keystone-fenwick-g2": "/images/real/case-fenwick-2.jpg",
  "keystone-fenwick-g3": "/images/694b15cb20ad4276873984820a3affda.jpeg",
  "keystone-solstice-g1": "/images/real/case-solstice-1.jpg",
  "keystone-solstice-g2": "/images/real/case-solstice-2.jpg",
  "keystone-solstice-g3": "/images/ae2eb5761b3d482ea021d2948f95c56e.jpeg",
  /* Floor plans — use blueprint/documentation image */
  "keystone-meridian-plan": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  "keystone-travertine-plan": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  "keystone-longfield-plan": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  "keystone-cascadia-plan": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  "keystone-fenwick-plan": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  "keystone-solstice-plan": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  /* Client portraits — real lifestyle photography */
  "keystone-meridian-client": "/images/real/client-meridian.jpg",
  "keystone-travertine-client": "/images/real/client-travertine.jpg",
  "keystone-longfield-client": "/images/real/client-longfield.jpg",
  "keystone-cascadia-client": "/images/real/client-cascadia.jpg",
  "keystone-fenwick-client": "/images/real/client-fenwick.jpg",
  "keystone-solstice-client": "/images/real/client-solstice.jpg",
  /* Process phase images for knowledge center */
  "keystone-discovery": "/images/bc80a497173c46c38d6307fb2c065ae1.jpeg",
  "keystone-design": "/images/20e8d5b74b8840678d40bd8cfed3721d.jpeg",
  "keystone-docs": "/images/37b0ea6621f747b9a1378f74b28677bc.jpeg",
  "keystone-build": "/images/real/case-cascadia-2.jpg",
  "keystone-deliver": "/images/ae2eb5761b3d482ea021d2948f95c56e.jpeg",
  /* Team member portraits — real photography (studio + on-site) */
  "keystone-marcus-prof": "/images/real/team-marcus.jpg",
  "keystone-elena-prof": "/images/real/team-elena.png",
  "keystone-james-prof": "/images/real/team-james.jpg",
  "keystone-sofia-prof": "/images/real/team-sofia.jpg",
  "keystone-daniel-prof": "/images/real/team-daniel.jpg",
  "keystone-amara-prof": "/images/real/team-amara.jpg",
  "keystone-theo-prof": "/images/real/team-theo.png",
  "keystone-nina-prof": "/images/real/team-nina.jpg",
  "keystone-owen-prof": "/images/real/team-owen.jpg",
  /* Article/art images */
  "keystone-light-art": "/images/215c780b6be547a4830cfe92998d17a2.jpeg",
  "keystone-concrete-art": "/images/61726f535b24412fb7c47a9482e11188.jpeg",
  "keystone-oak-art": "/images/93b180fd558b4445ad81e5c4caf6a47f.jpeg",
  "keystone-plate-art": "/images/real/studio-plate.jpg",
  /* Studio — real photography */
  "keystone-studio": "/images/real/studio-plate.jpg",
  "keystone-studio-models": "/images/real/studio-models.jpg",
  /* Fallback cinematic defaults */
  _default_hero: "/images/real/case-meridian-1.jpg",
  _default_detail: "/images/real/case-cascadia-2.jpg",
  _default_thumb: "/images/real/case-meridian-2.jpg",
};

export function kcImg(seed: string, w?: number, _h?: number): string {
  if (KC_IMG[seed]) return KC_IMG[seed];
  /* Try partial matches for gallery items */
  if (seed.indexOf("-g") > -1) {
    const base = seed.split("-g")[0];
    const idx = seed.split("-g")[1] || "1";
    if (KC_IMG[`${base}-g${idx}`]) return KC_IMG[`${base}-g${idx}`];
    if (KC_IMG[`${base}-g1`]) return KC_IMG[`${base}-g1`];
    if (KC_IMG[`${base}-hero`]) return KC_IMG[`${base}-hero`];
  }
  if (seed.indexOf("-hero") > -1 && KC_IMG[seed.replace("-hero", "-g1")])
    return KC_IMG[seed.replace("-hero", "-g1")];
  if (seed.indexOf("-plan") > -1) return KC_IMG["keystone-meridian-plan"];
  if (seed.indexOf("-client") > -1) return KC_IMG["keystone-meridian-client"];
  if (seed.indexOf("-prof") > -1) return KC_IMG["keystone-marcus-prof"];
  if (seed.indexOf("-art") > -1) return KC_IMG["keystone-light-art"];
  /* Fallback by size category */
  if (w && w >= 1200) return KC_IMG._default_hero;
  if (w && w >= 400) return KC_IMG._default_detail;
  return KC_IMG._default_thumb;
}

export default KC_IMG;
