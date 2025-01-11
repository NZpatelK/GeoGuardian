import React, { useRef } from 'react'
import gripHandle from '../../assets/grip handle.svg'
import './Modal.css';
export const Modal:React.FC = () => {
    const cardRef = useRef<HTMLDivElement| null>(null);
    let startX = 0; 
    let startY = 0;

    const mouseDown = (e: React.MouseEvent) => {
        startX = e.clientX;
        startY = e.clientY;

        document.addEventListener('mousemove', mouseMove);
        document.addEventListener('mouseup', mouseUp);
    };
    
    const mouseMove = (e: MouseEvent) => {
        if (!cardRef.current) return;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const cardRect = cardRef.current.getBoundingClientRect();
    
        const newX = startX - e.clientX;
        const newY = startY - e.clientY;
    
        startX = e.clientX;
        startY = e.clientY;
    
        let nextTop = cardRef.current.offsetTop - newY;
        let nextLeft = cardRef.current.offsetLeft - newX;
    
        // Ensure the card stays within the window boundaries
        if (nextTop < 0) nextTop = 0;
        if (nextLeft < 0) nextLeft = 0;
        if (nextTop + cardRect.height > windowHeight) {
          nextTop = windowHeight - cardRect.height;
        }
        if (nextLeft + cardRect.width > windowWidth) {
          nextLeft = windowWidth - cardRect.width;
        }
    
        cardRef.current.style.top = `${nextTop}px`;
        cardRef.current.style.left = `${nextLeft}px`;
    }

    const mouseUp = () => {
        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);
    }

    return (
        <div className='modal-card' ref={cardRef}>
            <div className="drag-btn" onMouseDown={mouseDown}> 
                <img src={gripHandle} alt="" className='grip-handle'/>
            </div>
            Modal 
        </div>
    )
}
