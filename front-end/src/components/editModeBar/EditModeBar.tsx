import React from 'react'
import './EditModeBar.css'

interface EditModeBarProps {
    togglePastureControl: (modeinput: 1 | 2 | 3 | 4 | 5) => void;
    handleClickDone: () => void;
    isDelete?: boolean;
}

export const EditModeBar: React.FC<EditModeBarProps> = ({ togglePastureControl, handleClickDone, isDelete }) => {
    const [toggle, setToggle] = React.useState(0);
    return (
        <div className='edit-mode-bar-container'>
            {!isDelete && <div className='edit-mode-bar'>
                <button className='add-btn' onClick={() => { togglePastureControl(4); setToggle(1) }} disabled={toggle === 1}>Add Point</button>
                <button className='delete-btn' onClick={() => { togglePastureControl(5); setToggle(2) }} disabled={toggle === 2}>Delete Point</button>

            </div>}
            {isDelete && <h5 className='delete-message'>Select a pasture to delete it. Click Done when done</h5>}
            <button className={isDelete ? 'delete-mode done-btn' : 'done-btn'} onClick={handleClickDone}>Done</button>
        </div>
    )
}
