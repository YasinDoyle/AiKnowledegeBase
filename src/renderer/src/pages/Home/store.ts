import { create } from 'zustand'
interface HomeState {
  welcomeShow: boolean
  setWelcomeShow: (show: boolean) => void
}

const useHomeStore = create<HomeState>((set) => ({
  welcomeShow: false,
  setWelcomeShow: (show) => set({ welcomeShow: show }),
}))

export default useHomeStore
