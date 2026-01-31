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
        // Fallback for browsers that don't support startViewTransition
        if (!('startViewTransition' in document)) {
            setTheme(newTheme)
            localStorage.setItem("theme", newTheme)
            applyTheme(newTheme)
            return
        }

        // Extremely fast cross-fade for a smooth feel
        (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
            setTheme(newTheme)
            localStorage.setItem("theme", newTheme)
            applyTheme(newTheme)
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border/40 hover:bg-accent transition-colors active:scale-95 group">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 p-1 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                <DropdownMenuItem
                    onClick={() => handleThemeChange("light")}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground"
                >
                    <Sun className="h-4 w-4 text-amber-500" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange("dark")}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground"
                >
                    <Moon className="h-4 w-4 text-indigo-400" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange("system")}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors focus:bg-accent focus:text-accent-foreground"
                >
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
