"use client";

import { motion } from "framer-motion";
import Image from "next/image";

// Sample Data for Global Users
const activeUsers = [
    { country: "USA", users: "45,000", flag: "🇺🇸", top: "32%", left: "18%" },
    { country: "Canada", users: "8,000", flag: "🇨🇦", top: "15%", left: "15%" },
    { country: "Brazil", users: "18,000", flag: "🇧🇷", top: "60%", left: "28%" },
    { country: "England", users: "30,000", flag: "🇬🇧", top: "28%", left: "46%" },
    { country: "Austria", users: "12,000", flag: "🇦🇹", top: "32%", left: "52%" },
    { country: "South Africa", users: "3,000", flag: "🇿🇦", top: "75%", left: "53%" },
    { country: "India", users: "1,000", flag: "🇮🇳", top: "50%", left: "68%" },
    { country: "China", users: "3,500", flag: "🇨🇳", top: "38%", left: "74%" },
    { country: "Indonesia", users: "24,000", flag: "🇮🇩", top: "65%", left: "78%" },
    { country: "Japan", users: "10,300", flag: "🇯🇵", top: "35%", left: "85%" },
];

export function GlobalReachSection() {
    return (
        <section className="relative py-16 bg-slate-50 overflow-hidden">
            {/* Background Map - Stylized Dotted World Map Image */}
            <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
                {/* Using a high-quality dotted map image from Unsplash or specialized source */}
                <Image
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                    alt="World Map Background"
                    fill
                    className="object-cover object-center opacity-20 grayscale contrast-125 mix-blend-multiply"
                />
                {/* Radial Gradient Overlay to fade edges */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#f8fafc_100%)]"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                        Active Users
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                        Our application has spread across <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            continents
                        </span>{" "}
                        and has many active users
                    </h2>
                    <p className="text-slate-500 text-lg">
                        Join a global community of engineers mastering their interview skills.
                    </p>
                </div>

                {/* Map Visualization Area */}
                <div className="relative w-full max-w-6xl mx-auto h-[300px] md:h-[450px] mt-8">
                    {/* Dotted Map Pattern Background (CSS-based fallback if image fails or for extra texture) */}
                    <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-30 mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)"></div>

                    {/* Active User Cards */}
                    {activeUsers.map((user, index) => (
                        <motion.div
                            key={user.country}
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{
                                duration: 0.5,
                                delay: index * 0.1,
                                type: "spring",
                                stiffness: 100
                            }}
                            style={{ top: user.top, left: user.left }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                        >
                            {/* Card Content */}
                            <div className="relative bg-white p-2 pr-4 rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-3 hover:scale-110 hover:shadow-xl hover:border-blue-100 transition-all duration-300 w-max cursor-pointer z-10">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-lg shadow-inner">
                                    {user.flag}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">{user.country}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">{user.users} users</span>
                                </div>
                            </div>

                            {/* Pulse Effect Behind Card */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/10 rounded-full animate-ping opacity-20 -z-10 group-hover:opacity-40 duration-1000"></div>

                            {/* Connecting Dot */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-slate-200 to-transparent opacity-50 hidden md:block"></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
