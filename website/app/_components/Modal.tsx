"use client"


export default function Modal({
    children, modalClass, closeButtonClass, closeButtonText
}: { children: React.ReactNode, modalClass: string, closeButtonClass: string, closeButtonText: string }) {
    return (
        <div className={modalClass}>
            {children}
            <button className={closeButtonClass}>{closeButtonText}</button>
        </div>
    )
}
