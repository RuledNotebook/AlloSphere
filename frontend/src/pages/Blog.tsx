import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { X, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { LogoMark } from '../components/Logo'

const POSTS = [
  {
    id: 'cryptic-allostery-primer',
    date: 'March 28, 2026',
    tag: 'Science',
    title: 'What is cryptic allostery and why does it matter for drug discovery?',
    summary: 'Most proteins have hidden pockets that only appear transiently during conformational dynamics. These cryptic allosteric sites bypass resistance mutations and allow fine-tuned modulation — but finding them has required weeks of expert compute, until now.',
    readTime: '7 min read',
    body: `Allosteric regulation is one of the most elegant mechanisms in biology. When a small molecule binds at a site distant from the active site, it can reshape the entire protein — altering catalytic activity, protein-protein interactions, or downstream signaling. Traditional allosteric modulators target sites that are structurally visible in a crystal structure. But the most interesting sites are the ones that don't show up until the protein is moving.

Cryptic allosteric sites are pockets that exist only transiently, formed by the natural conformational dynamics of the protein. They open for milliseconds to microseconds, expose a druggable cavity, and then close again. In a static crystal structure, they are invisible. This is precisely what makes them so valuable: resistance mutations cluster at the orthosteric site (the active site), but the cryptic allosteric site is often structurally remote, evolutionarily conserved, and completely unaffected by resistance mutations.

The challenge has always been finding them. Conventional MD simulations run at 1–10 ns/day — nowhere near the timescales at which cryptic pockets form. Enhanced sampling methods like metadynamics can accelerate this, but require expert tuning, weeks of cluster compute, and still produce trajectories that require manual inspection frame by frame.

AlloSphere changes this by combining GPU-accelerated enhanced sampling (Scout) with an equivariant neural network that watches every frame simultaneously (Reveal). The pipeline runs end to end on a single workstation in hours, not weeks — and the AI steers the simulation toward unexplored conformational space in real time, so compute is never wasted.

The downstream impact is significant. If a cryptic allosteric site can be found and a ligand can be shown to transmit a meaningful signal (what Signal predicts), you have a chemical probe that is mechanistically distinct from anything in a resistance-prone active site. For oncology programs stalled by kinase inhibitor resistance, or GPCR programs where full agonism is not desirable, this represents a fundamentally new class of starting points.`,
  },
  {
    id: 'eg-gnn-pocket-detection',
    date: 'March 14, 2026',
    tag: 'Technical',
    title: 'Why we built Reveal on an E(3)-equivariant GNN instead of a CNN',
    summary: 'Protein surface geometry is inherently three-dimensional and orientation-independent. Standard convolutional architectures break when you rotate the input. Here is why equivariance is non-negotiable for reliable pocket detection.',
    readTime: '9 min read',
    body: `When we started building Reveal, the obvious baseline was a 3D CNN operating on volumetric representations of the protein surface — voxelized electron density or surface potential maps. CNNs are fast, well-understood, and there are strong precedents in structure-based drug discovery. But they have a fundamental problem: they are not equivariant to rotation.

If you rotate a protein by 30 degrees before voxelizing it, a CNN will produce a completely different output. This means the model has to learn the same pocket-detection capability for every possible orientation of every possible pocket geometry — an enormous waste of model capacity, and a source of variance that degrades generalization to new proteins.

E(3)-equivariant architectures solve this by construction. An E(3)-equivariant network processes geometric features (positions, distances, angles) in a way that transforms predictably under rotations, reflections, and translations. When you rotate the input, the output rotates in a corresponding way. This means the model only needs to learn each geometric motif once, regardless of its orientation in space.

For pocket detection specifically, this matters because the defining features of a druggable pocket are geometric: a minimum volume, a hydrophobic core, a polar rim, specific curvature. These features are orientation-independent by definition. An equivariant model can recognize them regardless of how the protein was crystallized or how the trajectory frame was generated.

The practical results are significant. Our EG-GNN achieves 94% recall on held-out proteins with a false positive rate of 8%, without any trajectory alignment preprocessing. A comparable 3D CNN required alignment and achieved 81% recall at the same false positive rate. The equivariant model is also substantially more parameter-efficient — we achieve these results with 12M parameters versus 48M for the CNN baseline.`,
  },
  {
    id: 'atlas-signal-training',
    date: 'February 26, 2026',
    tag: 'Technical',
    title: 'Training Signal on ATLAS: predicting allosteric effect without running MD',
    summary: 'The ATLAS database contains 1,200 experimentally confirmed allosteric modulators across GPCRs, kinases, and nuclear receptors. Here is how we used it to train a graph transformer that replaces multi-day perturbation MD with an 8-minute forward pass.',
    readTime: '11 min read',
    body: `Perturbation molecular dynamics is the gold standard for predicting allosteric effect. You run an MD simulation with the ligand bound, perturb each residue independently, and measure the resulting changes in dynamics at the functional site. The difference between perturbed and unperturbed dynamics at the functional site tells you whether binding at the allosteric site transmits a meaningful signal.

The problem is that this requires dozens of independent MD runs per compound, each on the order of 100 ns to 1 μs. For a hit list of even 100 compounds, this is months of cluster compute. It is simply not compatible with a drug discovery timeline.

The insight behind Signal is that the allosteric communication pathways in a protein are largely encoded in the protein's dynamic contact network — the pattern of correlated motions between residues. If you can model this network as a graph and train a transformer to predict how perturbations at one node propagate to another, you can replace the MD calculation with a forward pass.

ATLAS gave us the training signal. Each entry in ATLAS includes the modulator structure, the binding site, the target protein, and the experimentally measured functional effect (agonist, antagonist, or neutral). Crucially, for a subset of entries, perturbation MD data is available, providing residue-level pathway information. We trained Signal on this subset first, then fine-tuned on the full dataset using experimental labels.

The result is a model that achieves 84% accuracy on held-out receptor classes at predicting modulator type, and correctly identifies the key pathway residues in 78% of cases where perturbation MD ground truth is available. Inference takes 8 minutes on a single A100. We consider this the single most scientifically novel component of AlloSphere.`,
  },
  {
    id: 'gpu-md-throughput',
    date: 'February 10, 2026',
    tag: 'Engineering',
    title: '12 μs/day on a desktop: how Scout achieves cluster-class MD throughput on one GPU',
    summary: 'Three years ago, 12 μs/day required a 400-node HPC allocation and weeks of queue time. Today it runs on a single NVIDIA A100 in your lab. A technical walkthrough of the OpenMM + REST2 + AI-steering stack.',
    readTime: '8 min read',
    body: `The throughput story for Scout comes from three compounding improvements: GPU-optimized force evaluation, replica exchange parallelism, and AI-steered sampling efficiency.

The baseline is OpenMM 8.1 running on CUDA 12.2. OpenMM's GPU backend has been continuously optimized over the past decade, and modern A100/H100 hardware achieves roughly 10× the throughput of the V100-class hardware from 2020. On a well-tuned system with the AMBER ff19SB force field and TIP4P-EW water, we measure approximately 8 μs/day on a single A100 for a typical 50–60 kDa protein.

REST2 contributes the remaining throughput by using GPU memory that would otherwise be idle. REST2 (Replica Exchange with Solute Tempering 2) runs multiple temperature replicas, periodically exchanging configurations to help the simulation escape kinetic traps. In our implementation, we run 4–8 replicas depending on available VRAM, with all replicas on the same GPU using CUDA streams. The overhead of exchange attempts is negligible; the net effect is that each replica converges faster, and the combined exploration rate scales approximately linearly with replica count.

The AI steering layer is where the efficiency gain compounds. Standard metadynamics places a bias on collective variables that discourages re-visiting already-explored states. But choosing which collective variables to bias is non-trivial — bias the wrong ones and you waste compute on directions of conformational space that do not contain pockets. Our co-running neural network monitors the visited conformational space in real time and dynamically adjusts the bias direction toward high-novelty regions. In practice, this reduces the compute required to find a cryptic pocket event by 3–4× compared to unsteered metadynamics on benchmark systems.`,
  },
]

interface PostFull {
  id: string
  date: string
  tag: string
  title: string
  summary: string
  readTime: string
  body: string
}

function PostView({ post, onBack }: { post: PostFull; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ maxWidth: 680, margin: '0 auto', padding: '52px 24px 80px' }}
    >
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, sans-serif', marginBottom: 40, padding: 0 }}
      >
        <ArrowLeft size={14} /> Back to posts
      </button>
      <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--coral)', fontWeight: 600, marginBottom: 12 }}>{post.tag}</div>
      <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.5px', lineHeight: 1.25, marginBottom: 16 }}>{post.title}</h1>
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 36, paddingBottom: 32, borderBottom: '1px solid var(--light-pink)' }}>
        <span>{post.date}</span>
        <span>{post.readTime}</span>
      </div>
      <div style={{ fontSize: 15, color: 'var(--text-mid)', lineHeight: 1.85 }}>
        {post.body.split('\n\n').map((para, i) => (
          <p key={i} style={{ marginBottom: 24 }}>{para}</p>
        ))}
      </div>
    </motion.div>
  )
}

export default function Blog() {
  const navigate = useNavigate()
  const [active, setActive] = useState<PostFull | null>(null)

  return (
    <div style={{ minHeight: '100%', background: 'var(--surface)' }}>
      {active ? (
        <PostView post={active} onBack={() => setActive(null)} />
      ) : (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>

          <motion.div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <LogoMark size={22} color="rgba(204,98,98,0.7)" />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--coral)', letterSpacing: '1px', textTransform: 'uppercase' }}>AlloSphere</span>
            </div>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1px solid var(--light-pink)',
                borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: 500, color: 'var(--text-muted)',
                fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--coral)'; e.currentTarget.style.color = 'var(--deep-coral)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--light-pink)'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              <X size={12} /> Exit
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.4 }}
            style={{ marginBottom: 52 }}
          >
            <h1 style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.8px', marginBottom: 10 }}>
              Blog
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>
              Science, engineering, and drug discovery from the AlloSphere team.
            </p>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {POSTS.map((post, i) => (
              <motion.div
                key={post.id}
                onClick={() => setActive(post)}
                style={{
                  padding: '28px 0',
                  borderTop: '1px solid var(--light-pink)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 24,
                }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.38 }}
                whileHover={{ x: 4 }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: 'var(--blush)', color: 'var(--deep-coral)', border: '1px solid var(--light-pink)' }}>
                      {post.tag}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.date}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{post.readTime}</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-dark)', letterSpacing: '-0.2px', marginBottom: 8, lineHeight: 1.35 }}>
                    {post.title}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                    {post.summary}
                  </div>
                </div>
                <ArrowUpRight size={16} color="var(--salmon)" style={{ flexShrink: 0, marginTop: 4 }} />
              </motion.div>
            ))}
            <div style={{ borderTop: '1px solid var(--light-pink)' }} />
          </div>
        </div>
      )}
    </div>
  )
}
