import { Moon, Sun, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

export function ThemeToggle() {
    const [, setTheme] = useState<Theme>("light")

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") as Theme
        if (savedTheme) {
            setTheme(savedTheme)
            applyTheme(savedTheme)
        } else {
            setTheme("light")
            applyTheme("light")
        }
    }, [])

    const applyTheme = (newTheme: Theme) => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (newTheme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"
            root.classList.add(systemTheme)
        } else {
            root.classList.add(newTheme)
        }
    }

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)
        applyTheme(newTheme)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full border border-border/50 bg-muted/50 hover:bg-muted/80 transition-all duration-500 group">
                    <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-3xl border-border/50 rounded-2xl p-2 shadow-2xl">
                <DropdownMenuItem onClick={() => handleThemeChange("light")} className="text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl cursor-pointer group">
                    <Sun className="mr-3 h-4 w-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                    <span>Light Theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("dark")} className="text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl cursor-pointer group">
                    <Moon className="mr-3 h-4 w-4 text-blue-400 group-hover:-rotate-12 transition-transform" />
                    <span>Dark Theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleThemeChange("system")}>
                    <Laptop className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl cursor-pointer group">System Default</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
