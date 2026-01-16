export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    date: string;
    category: string;
    image: string;
    readTime: string;
}

export const blogPosts: BlogPost[] = [
    {
        slug: "ace-system-design-interview-2025",
        title: "How to Ace the System Design Interview in 2025",
        excerpt: "A comprehensive guide to mastering distributed systems, scalability, and trade-off analysis for L5+ engineering roles.",
        content: `
            <p>System design interviews are often the most daunting part of the technical interview process. Unlike coding rounds, there's no single "correct" answer. Instead, interviewers are looking for your ability to reason about trade-offs, scale systems, and handle real-world constraints.</p>
            
            <h3>1. Master the Fundamentals</h3>
            <p>Before diving into complex architectures, ensure you have a solid grasp of:
                <ul>
                    <li>Load Balancing (Layer 4 vs Layer 7)</li>
                    <li>Caching strategies (Write-through, Write-around, Eviction policies)</li>
                    <li>Database Sharding and Partitioning</li>
                    <li>Consistency models (Eventual vs Strong)</li>
                </ul>
            </p>

            <h3>2. The Step-by-Step Approach</h3>
            <p>Don't jump straight into drawing boxes. Follow this framework:
                <ol>
                    <li><strong>Clarify Requirements:</strong> Ask about scale, users, and core features.</li>
                    <li><strong>Capacity Estimation:</strong> Calculate traffic, storage, and memory needs.</li>
                    <li><strong>API Design:</strong> Define the main endpoints.</li>
                    <li><strong>High-Level Design:</strong> Sketch the major components.</li>
                    <li><strong>Deep Dive:</strong> Explore 1-2 critical parts of the system.</li>
                </ol>
            </p>

            <h3>3. Modern Trends in 2025</h3>
            <p>In 2025, interviewers are increasingly focusing on:
                <ul>
                    <li>AI-driven component scaling</li>
                    <li>Serverless vs Edge computing trade-offs</li>
                    <li>Privacy-first data architectures</li>
                </ul>
            </p>
        `,
        author: "Alex Chen",
        date: "Jan 10, 2025",
        category: "Interview Tips",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=600&fit=crop",
        readTime: "8 min read"
    },
    {
        slug: "rise-of-ai-in-tech-hiring",
        title: "The Rise of AI in Tech Hiring: What Candidates Need to Know",
        excerpt: "Understanding how companies are using AI to screen candidates and how you can optimize your profile for the new era.",
        content: `
            <p>The recruitment landscape is undergoing a massive shift. From automated resume screening to AI-powered initial interviews, the gatekeepers of tech roles are increasingly digital.</p>
            
            <h3>Understanding the AI Recruiter</h3>
            <p>Most large companies now use Applicant Tracking Systems (ATS) that employ LLMs to match candidate profiles with job descriptions. This means your resume needs to be both human-readable and machine-optimized.</p>

            <h3>How to Adapt</h3>
            <p>To succeed in this new environment:
                <ul>
                    <li>Focus on quantifiable achievements.</li>
                    <li>Use industry-standard terminology.</li>
                    <li>Prepare for AI behavioral interviews where tone and clarity are as important as content.</li>
                </ul>
            </p>
        `,
        author: "Sarah Jones",
        date: "Jan 5, 2025",
        category: "Industry Trends",
        image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&h=600&fit=crop",
        readTime: "6 min read"
    },
    {
        slug: "top-10-behavioral-interview-questions",
        title: "Top 10 Behavioral Interview Questions Answered",
        excerpt: "Breaking down the most common STAR method questions and how to structure your stories for maximum impact.",
        content: `
            <p>Behavioral interviews are based on the premise that past behavior is the best predictor of future performance. The key to acing these is preparation and the STAR method.</p>
            
            <h3>The STAR Method</h3>
            <p><strong>S</strong>ituation, <strong>T</strong>ask, <strong>A</strong>ction, <strong>R</strong>esult. Your answer should spend 70% of the time on the Action and Result.</p>

            <h3>Top Questions to Prepare</h3>
            <ol>
                <li>Tell me about a time you failed.</li>
                <li>Describe a conflict with a teammate.</li>
                <li>How do you handle ambiguous requirements?</li>
                <li>Tell me about a time you went above and beyond.</li>
            </ol>
        `,
        author: "Michael Ross",
        date: "Dec 28, 2024",
        category: "Behavioral",
        image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop",
        readTime: "10 min read"
    },
    {
        slug: "cracking-pm-interview-at-meta",
        title: "Cracking the Product Management Interview at Meta",
        excerpt: "Insider tips on product sense, execution, and leadership rounds from successful PM candidates.",
        content: `
            <p>Meta's PM interview is unique. It focuses heavily on "Product Sense" and "Execution." You're expected to think like an owner and prioritize ruthlessly.</p>
            
            <h3>The Three Pillars</h3>
            <p>1. <strong>Product Sense:</strong> Can you build the right thing for the right people?<br>
            2. <strong>Execution:</strong> Can you measure success and handle trade-offs?<br>
            3. <strong>Leadership:</strong> Can you drive alignment across teams?</p>
        `,
        author: "David Lee",
        date: "Dec 20, 2024",
        category: "Product Management",
        image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&h=600&fit=crop",
        readTime: "12 min read"
    },
    {
        slug: "data-structures-for-faang",
        title: "Data Structures You Actually Need for FAANG Interviews",
        excerpt: "Stop memorizing everything. Focus on these 7 core data structures that cover 90% of technical interview questions.",
        content: `
            <p>Don't get overwhelmed by obscure data structures. Focus on the ones that actually appear in interviews.</p>
            
            <h3>The Essential List</h3>
            <ul>
                <li>Arrays and Strings</li>
                <li>Hash Tables (The most common!)</li>
                <li>Linked Lists</li>
                <li>Stacks and Queues</li>
                <li>Trees (Mostly Binary Search Trees)</li>
                <li>Graphs</li>
                <li>Heaps / Priority Queues</li>
            </ul>
        `,
        author: "Emily White",
        date: "Dec 15, 2024",
        category: "Coding",
        image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=600&fit=crop",
        readTime: "7 min read"
    }
];

export function getPostBySlug(slug: string): BlogPost | undefined {
    return blogPosts.find(post => post.slug === slug);
}
