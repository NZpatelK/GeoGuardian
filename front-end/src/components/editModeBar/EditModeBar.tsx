import React from 'react'
import './EditModeBar.css'

interface EditModeBarProps {
    togglePastureControl: (modeinput: number) => void;
}

export const EditModeBar: React.FC<EditModeBarProps> = ({togglePastureControl}) => {
    return (
        <div className='edit-mode-bar-container'>
            <button className='add-btn' onClick={() => togglePastureControl(4)}>Add Point</button>
            <button className='delete-btn' onClick={() => togglePastureControl(5)}>Delete Point</button>
        </div>
    )
}
