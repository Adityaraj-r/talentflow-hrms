import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme")
    }
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    return "light"
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = async (e) => {
    // 1. Fallback for browsers without View Transitions
    if (!document.startViewTransition) {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"))
      return
    }

    // 2. Calculate the click position and the distance to the farthest corner
    // If 'e' is missing (e.g. keyboard shortcut), default to center screen
    const x = e?.clientX ?? window.innerWidth / 2
    const y = e?.clientY ?? window.innerHeight / 2
    
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    // 3. Start the transition
    const transition = document.startViewTransition(() => {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"))
    })

    // 4. Animate the clip-path (The "Ripple" Effect)
    await transition.ready
    
    // We animate the "New" view expanding from the click point
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        // This tells the browser to animate the NEW theme layer
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}