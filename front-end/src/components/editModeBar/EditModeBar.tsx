import React from 'react'
import './EditModeBar.css'

interface EditModeBarProps {
    togglePastureControl: (modeinput: number) => void;
}

export const EditModeBar: React.FC<EditModeBarProps> = ({ togglePastureControl }) => {
    const [toggle, setToggle] = React.useState(0);
    return (
        <div className='edit-mode-bar-container'>
            <div className='edit-mode-bar'>
                <button className='add-btn' onClick={() => { togglePastureControl(4); setToggle(1) }} disabled={toggle === 1}>Add Point</button>
                <button className='delete-btn' onClick={() => { togglePastureControl(5); setToggle(2) }} disabled={toggle === 2}>Delete Point</button>

            </div>
            <button className='done-btn'>Done</button>
        </div>
    )
}
