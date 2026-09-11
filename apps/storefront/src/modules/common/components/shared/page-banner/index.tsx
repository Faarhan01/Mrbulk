"use client"

import { useRouter } from "next/navigation"

type PageBannerProps = {
  title: string
  description?: string
  badge?: string
  onBack?: () => void
  actions?: React.ReactNode
  backLabel?: string
}

const PageBanner = ({
  title,
  description,
  badge,
  onBack,
  actions,
  backLabel = "Home",
}: PageBannerProps) => {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ui-fg-subtle px-1 select-none">
        <button
          onClick={handleBack}
          className="hover:text-ui-fg-base transition flex items-center gap-1 cursor-pointer font-semibold bg-transparent border-none p-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </button>
        <span>/</span>
        <span className="text-ui-fg-base font-extrabold">{title}</span>
      </div>

      <div className="relative w-full py-8 sm:py-12 px-4 sm:px-8 bg-ui-bg-base border border-ui-border-base rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-4">
          {badge && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-ui-bg-base border border-ui-border-base shadow-xs text-ui-fg-base select-text">
              <span>{badge}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-ui-fg-base select-text">
            {title}
          </h1>

          {description && (
            <p className="text-xs sm:text-sm text-ui-fg-subtle font-medium max-w-2xl mx-auto leading-relaxed select-text">
              {description}
            </p>
          )}

          {actions && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 select-none">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageBanner
