import useBodyScrollLock from '../../hooks/useBodyScrollLock'

export default function Modal({ open, children }) {
	useBodyScrollLock(open)

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 overscroll-contain overflow-y-auto bg-ink/30 p-4 sm:p-5">
			<div className="flex min-h-full items-center justify-center">
				<div className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-lg overscroll-contain overflow-y-auto rounded-3xl bg-white p-5 sm:p-6">
					{children}
				</div>
			</div>
		</div>
	)
}