import React, { useState } from 'react'
import './EditModeBar.css'
import { toast } from 'react-toastify';

interface EditModeBarProps {
    modeRefs: React.MutableRefObject<{
        message?: string;
        isAdd: boolean;
        isEdit: boolean;
        isDelete: boolean;
        isAddPoint: boolean;
        isDeletePoint: boolean;
    }>;
    handleClickDone: () => void;
    isDelete?: boolean;
}

export const EditModeBar: React.FC<EditModeBarProps> = ({ modeRefs, handleClickDone }) => {
    const [isSelectedMode, setIsSelectedMode] = useState(false);

    const togglePastureControl = (selectMode: 0 | 1 | 2 | 3 | 4 | 5, goBack?: boolean) => {
        if (selectMode === 0) {
            Object.assign(modeRefs.current, {
                isAdd: false,
                isEdit: false,
                isDelete: false,
                isAddPoint: false,
                isDeletePoint: false,
            });
            handleClickDone(); 
            if (goBack) {
                setIsSelectedMode(false);
            }
            
            return;
        }

        const modeMap = {
            1: { isAdd: true, message: "Click on the map to add a new pasture." },
            2: { isEdit: true, message: "Select a pasture to modify the shape." },
            3: { isDelete: true, message: "Select a pasture to remove it." },
            4: { isEdit: true, isAddPoint: true },
            5: { isEdit: true, isDeletePoint: true },
        };

        Object.assign(modeRefs.current, {
            isAdd: false,
            isEdit: false,
            isDelete: false,
            isAddPoint: false,
            isDeletePoint: false,
            ...modeMap[selectMode],
        });

        setIsSelectedMode(true);
    };


    return (
        <div className='edit-mode-bar-container'>
            {/* {!isDelete && <div className='edit-mode-bar'>
                <button className='add-btn' onClick={() => { togglePastureControl(4); setToggle(1) }} disabled={toggle === 1}>Add Point</button>
                <button className='delete-btn' onClick={() => { togglePastureControl(5); setToggle(2) }} disabled={toggle === 2}>Delete Point</button>

            </div>}
            {isDelete && <h5 className='delete-message'>Select a pasture to delete it. Click Done when done</h5>}
            <button className={'done-btn'} onClick={handleClickDone}>Done</button> */}
            <div>
                {!isSelectedMode && <div className="pasture-btn-group modal-btn-group">
                    <button onClick={() => togglePastureControl(1)} disabled={modeRefs.current.isAdd} style={{ marginLeft: "0", background: "#21bd02", color: "#fff" }}>Add</button>
                    <button onClick={() => togglePastureControl(2)} disabled={modeRefs.current.isEdit}>Edit</button>
                    <button onClick={() => togglePastureControl(3)} disabled={modeRefs.current.isDelete} style={{ marginRight: "0", background: "#d40202", color: "#fff" }} >Delete</button>
                </div>}

                {isSelectedMode && <h3 className="pasture-message">{modeRefs.current?.message}</h3>}
                {modeRefs.current.isEdit && <div className="point-btn-group modal-btn-group">
                    <button onClick={() => togglePastureControl(4)} disabled={modeRefs.current.isAddPoint} style={{ background: "#21bd02", color: "#fff" }}>Add Point</button>
                    <button onClick={() => togglePastureControl(5)} disabled={modeRefs.current.isDeletePoint} style={{ background: "#d40202", color: "#fff" }}>Delete Point</button>
                </div>}
                <div className="pasture-btn-group modal-btn-group">
                    {isSelectedMode && <button className={'back-btn'} onClick={() => togglePastureControl(0, true)}> Go Back </button>}
                    <button className={'done-btn'} onClick={() => togglePastureControl(0)}>Done</button>
                </div>

            </div>
        </div>
    )
}
