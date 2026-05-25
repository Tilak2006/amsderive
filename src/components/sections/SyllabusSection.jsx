import styles from '../../styles/syllabus.module.css';

const sections = [
  {
    num: '01',
    title: 'Mathematics',
    areas: [
      {
        name: 'Probability & Inference',
        topics: 'Sample spaces, Conditional probability, Bayes theorem, Discrete and continuous distributions, PMF / PDF / CDF, Joint distributions, Linearity of expectation, Moments, MGFs, Tail bounds'
      },
      {
        name: 'Stochastic Processes',
        topics: 'Markov chains, Transition matrices, Stationary distributions, Random walks, Martingales, Brownian motion intuition'
      },
      {
        name: 'Analytical Foundations',
        topics: 'Derivation over formula recall, First-principles reasoning, Modeling under uncertainty, Structured proof construction'
      }
    ]
  },
  {
    num: '02',
    title: 'Algorithms',
    areas: [
      {
        name: 'Graph Theory',
        topics: 'BFS, DFS, Shortest paths, Trees, Flows and matchings'
      },
      {
        name: 'Dynamic Programming',
        topics: 'Optimal substructure, State design, DP on sequences, DP on trees, DP on graphs'
      },
      {
        name: 'Optimization',
        topics: 'Greedy algorithms, Exchange arguments, Constraint handling, Expected-cost minimization'
      }
    ]
  },
  {
    num: '03',
    title: 'Quant Concepts',
    areas: [
      {
        name: 'Order Books',
        topics: 'Bid-ask structure, Limit and market orders, Price impact intuition'
      },
      {
        name: 'Pricing Intuition',
        topics: 'No-arbitrage reasoning, Risk-neutral thinking, Relative valuation'
      },
      {
        name: 'Arbitrage Logic',
        topics: 'Identifying mispricing, Constructing hedges, Reasoning about market efficiency'
      }
    ]
  }
];

const researchAreas = [
  { id: '01', text: 'Stochastic processes & probabilistic modeling' },
  { id: '02', text: 'Algorithmic game theory & market mechanisms' },
  { id: '03', text: 'High-performance computing & architecture' },
  { id: '04', text: 'Advanced combinatorics & number theory' },
  { id: '05', text: 'Competitive programming with mathematical depth' },
  { id: '06', text: 'Quantitative finance & strategy simulation' },
];

const roundOneTests = [
  'Reasoning under pressure',
  'Mathematical intuition',
  'Probabilistic thinking',
  'Algorithmic problem solving',
  'Strategic decision making',
];

const roundOneTopics = [
  {
    name: 'Probability & Expected Value',
    topics: [
      'conditional probability',
      'linearity of expectation',
      'intuitive EV reasoning',
      'distributions/basic variance intuition',
    ],
  },
  {
    name: 'Combinatorics',
    topics: [
      'counting',
      'constructive thinking',
      'parity/invariants',
      'recurrence intuition',
    ],
  },
  {
    name: 'Game Theory & Brain Teasers',
    topics: [
      'adversarial reasoning',
      'optimal play',
      'strategic simplification',
      'puzzle solving',
    ],
  },
  {
    name: 'Algorithms & Programming',
    topics: [
      'implementation',
      'greedy',
      'DP intuition',
      'basic data structures',
      'Codeforces Div2 C/D level thinking',
    ],
  },
  {
    name: 'Market Microstructure Basics',
    topics: [
      'bid/ask',
      'spread',
      'order flow intuition',
      'matching logic',
      'simple trading/game simulations',
    ],
  },
];

const practiceGroups = [
  {
    name: 'Competitive Programming',
    topics: [
      'Solve Div2 A-D regularly on Codeforces',
      'Focus more on reasoning than memorizing templates',
    ],
  },
  {
    name: 'Puzzles & Quant Teasers',
    topics: [
      'estimation problems',
      'probability puzzles',
      'game strategy questions',
      'mental models',
    ],
  },
];

const recommendedResources = [
  'Project Euler',
  'Brilliant.org',
  'Chess Programming Wiki for strategic/system thinking',
  'Green Book / classic quant interview puzzles',
  'YouTube channels around probability, game theory, and mathematical thinking',
];

// ── Round 2 · Posterior ──

const posteriorTopics = [
  {
    name: 'Probability & Expected Value',
    topics: [
      'conditional probability',
      'expected value & variance',
      'linearity of expectation',
      'probability distributions',
      'modular arithmetic for probabilities',
      'random processes & stopping conditions',
    ],
    examples: [
      'probability of ruin',
      'expected stopping time',
      'success probability of a strategy',
      'Markov-style state transitions',
    ],
  },
  {
    name: 'Dynamic Programming under Uncertainty',
    topics: [
      'DP over states',
      'optimal stopping',
      'threshold-based decisions',
      'maximizing expected reward',
      'minimizing expected loss',
      'position/state transitions with costs',
    ],
    examples: [
      'choosing when to stop',
      'deciding whether to act or wait',
      'trading/position DP with transaction costs',
      'optimizing decisions over a sequence of signals',
    ],
  },
  {
    name: 'Bayesian Inference & Signal Reliability',
    topics: [
      "Bayes' theorem",
      'posterior updates',
      'likelihoods & log probabilities',
      'hidden states / regimes',
      'model selection from observed data',
    ],
    examples: [
      'identifying which signal is reliable',
      'updating belief after observations',
      'detecting hidden regimes',
      'choosing the best predictor from noisy history',
    ],
  },
  {
    name: 'Simulation-Inspired Problems',
    topics: [
      'exact probability DP',
      'recurrence relations',
      'expected value equations',
      'state transition models',
    ],
    examples: [
      'queue fill probability',
      'random walks',
      'absorbing states',
      'repeated trials with changing state',
    ],
  },
  {
    name: 'Market Microstructure & Execution',
    topics: [
      'limit & market orders',
      'order book matching',
      'best bid / best ask & spread',
      'queue priority',
      'partial fills & cancellations',
    ],
    examples: [
      'maintaining an order book',
      'simulating trades',
      'calculating executed volume',
      'estimating whether an order gets filled',
    ],
  },
  {
    name: 'Risk, Cost & Overfitting',
    topics: [
      'transaction costs & slippage-like penalties',
      'risk-adjusted reward',
      'variance penalty',
      'overfitting intuition',
      'choosing among noisy strategies',
    ],
    examples: [
      'strategy survives before cost but fails after',
      'selecting signals without overfitting',
      'maximizing reward under risk/cost constraints',
    ],
  },
];

const posteriorSkills = [
  'arrays, maps, priority queues, sets',
  'sorting and binary search',
  'dynamic programming',
  'graph / state transitions',
  'modular arithmetic',
  'floating-point precision',
  'simulation-to-DP conversion',
  'efficient implementation under constraints',
];

const posteriorNotRequired = [
  'finance theory',
  'options pricing',
  'stock market knowledge',
  'prior trading experience',
  'machine learning libraries',
  'advanced economics',
];

const SyllabusSection = () => {
  return (
    <section id="syllabus" className={styles.syllabusPage}>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Syllabus</h1>

        <details className={styles.prepGuide}>
          <summary className={styles.prepGuideSummary}>
            <span className={styles.prepGuideSummaryCopy}>
              <span className={styles.prepGuideEyebrow}>Round 1 · PRIOR</span>
              <span className={styles.prepGuideTitle}>AMS Derive Prior | Syllabus &amp; Scope</span>
              <span className={styles.prepGuidePreview}>
                Preparation guide for the first online round.
              </span>
            </span>
            <span className={styles.prepGuideToggle} aria-hidden="true" />
          </summary>

          <div className={styles.prepGuideBody}>
            <div className={styles.prepGuideIntro}>
              <h2 className={styles.prepBlockTitle}>What Round 1 Tests</h2>
              <p className={styles.prepLead}>
                Round 1 tests reasoning under pressure, mathematical intuition, probabilistic thinking,
                algorithmic problem solving, and strategic decision making.
              </p>
              <p className={styles.prepEmphasis}>It does not test rote memorization.</p>
              <div className={styles.focusGrid}>
                {roundOneTests.map((item) => (
                  <span key={item} className={styles.focusPill}>{item}</span>
                ))}
              </div>
            </div>

            <div className={styles.prepBlock}>
              <h2 className={styles.prepBlockTitle}>Topics You Should Be Comfortable With</h2>
              <div className={styles.prepTopicGrid}>
                {roundOneTopics.map((group) => (
                  <article key={group.name} className={styles.prepTopicCard}>
                    <h3>{group.name}</h3>
                    <ul>
                      {group.topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.prepBlock}>
              <h2 className={styles.prepBlockTitle}>Suggested Practice</h2>
              <div className={styles.practiceGrid}>
                {practiceGroups.map((group) => (
                  <article key={group.name} className={styles.practiceCard}>
                    <h3>{group.name}</h3>
                    <ul>
                      {group.topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.prepBlock}>
              <h2 className={styles.prepBlockTitle}>Recommended Resources</h2>
              <ul className={styles.resourceList}>
                {recommendedResources.map((resource) => (
                  <li key={resource}>{resource}</li>
                ))}
              </ul>
            </div>

            <div className={styles.importantNote}>
              <span className={styles.importantNoteLabel}>Important Note</span>
              <p>
                AMS Derive is designed to reward original thinking and problem solving ability over
                memorized tricks.
              </p>
              <p>
                You do NOT need prior finance or trading experience to perform well. Anything requiring
                financial context or prerequisite knowledge will be described in the question for people
                who do not already know it.
              </p>
            </div>
          </div>
        </details>

        {/* ── Round 2 · Posterior Syllabus ── */}
        <details className={`${styles.prepGuide} ${styles.prepGuidePosterior}`}>
          <summary className={styles.prepGuideSummary}>
            <span className={styles.prepGuideSummaryCopy}>
              <span className={`${styles.prepGuideEyebrow} ${styles.posteriorEyebrow}`}>Round 2 · POSTERIOR</span>
              <span className={styles.prepGuideTitle}>AMS Derive Posterior | Syllabus &amp; Scope</span>
              <span className={styles.prepGuidePreview}>
                A programming contest built around quantitative reasoning, probability, inference, and market microstructure.
              </span>
            </span>
            <span className={styles.prepGuideToggle} aria-hidden="true" />
          </summary>

          <div className={styles.prepGuideBody}>
            <div className={styles.prepGuideIntro}>
              <p className={styles.prepLead}>
                The Posterior round will be a programming contest with problems designed around quantitative reasoning,
                probability, inference, and market microstructure.
              </p>
              <p className={styles.prepEmphasis}>
                No prior finance knowledge required — only quantitative thinking through code.
              </p>
            </div>

            <div className={styles.prepBlock}>
              <h2 className={styles.prepBlockTitle}>Topics &amp; Problem Areas</h2>
              <div className={styles.prepTopicGrid}>
                {posteriorTopics.map((group) => (
                  <article key={group.name} className={`${styles.prepTopicCard} ${styles.posteriorCard}`}>
                    <h3>{group.name}</h3>
                    <ul>
                      {group.topics.map((topic) => (
                        <li key={topic}>{topic}</li>
                      ))}
                    </ul>
                    {group.examples && (
                      <>
                        <p className={styles.posteriorExampleLabel}>Example areas</p>
                        <ul>
                          {group.examples.map((ex) => (
                            <li key={ex} className={styles.posteriorExample}>{ex}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </article>
                ))}
              </div>
            </div>

            <div className={styles.prepBlock}>
              <h2 className={styles.prepBlockTitle}>Required Programming Skills</h2>
              <ul className={styles.resourceList}>
                {posteriorSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>

            <div className={styles.importantNote}>
              <span className={`${styles.importantNoteLabel} ${styles.posteriorNoteLabel}`}>What Is Not Required</span>
              <div className={styles.focusGrid} style={{ marginTop: '4px' }}>
                {posteriorNotRequired.map((item) => (
                  <span key={item} className={`${styles.focusPill} ${styles.posteriorPill}`}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </details>

        <hr className={styles.divider} />

        <div className={styles.sectionsWrapper}>
          {sections.map((sec, idx) => (
            <div key={idx}>
              {idx > 0 && <hr className={styles.divider} />}
              <div className={styles.sectionHead}>
                <span className={styles.sectionNum}>{sec.num}</span>
                <h2 className={styles.sectionTitle}>{sec.title}</h2>
              </div>
              <div className={styles.topicTable}>
                {sec.areas.map((area, aIdx) => (
                  <div key={aIdx} className={styles.topicRow}>
                    <span className={styles.topicName}>{area.name}</span>
                    <span className={styles.topicList}>{area.topics}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* ── Research & Application ── */}
        <h2 className={styles.subsectionLabel}>Research &amp; Application</h2>
        <div className={styles.researchGrid}>
          {researchAreas.map((area) => (
            <div key={area.id} className={styles.researchCard}>
              <span className={styles.researchIndex}>{area.id}</span>
              <span className={styles.researchText}>{area.text}</span>
            </div>
          ))}
        </div>

        <hr className={styles.divider} />

        {/* ── Resources CTA ── */}
        <div className={styles.resourcesBlock}>
          <div className={styles.resourcesLabel}>Learning Hub</div>
          <h2 className={styles.resourcesTitle}>Want to master these concepts?</h2>
          <p className={styles.resourcesDesc}>
            Check out our curated repository of high-signal resources, books, and problem sets to build your first-principles foundation.
          </p>
          <a
            href="https://amsociety.in/resources"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.resourcesBtn}
          >
            View Resources
          </a>
        </div>
      </div>
    </section>
  );
};

export default SyllabusSection;
