import React from 'react'
import './EditModeBar.css'
import { toast } from 'react-toastify';

interface EditModeBarProps {
    modeRefs: React.MutableRefObject<{
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
    const [isSelectedMode, setIsSelectedMode] = React.useState(false);
    const togglePastureControl = (selectMode: 0 | 1 | 2 | 3 | 4 | 5, goBack?: boolean) => {
        if (selectMode === 0) {
            Object.assign(modeRefs.current, {
                isAdd: false,
                isEdit: false,
                isDelete: false,
                isAddPoint: false,
                isDeletePoint: false,
            });
            setIsSelectedMode(false);
            if (!goBack) {
                handleClickDone();
            }
            return;
        }

        const modeMap = {
            1: { isAdd: true, message: "Add Mode: Click on the map to create a new pasture." },
            2: { isEdit: true, message: "Edit Mode: Select a pasture to modify its shape." },
            3: { isDelete: true, message: "Delete Mode: Select a pasture to remove it." },
            4: { isEdit: true, isAddPoint: true, message: "Add Point Mode: Click on a boundary to add a new point." },
            5: { isEdit: true, isDeletePoint: true, message: "Delete Point Mode: Select an existing point to remove it." },
        };

        Object.assign(modeRefs.current, {
            isAdd: false,
            isEdit: false,
            isDelete: false,
            isAddPoint: false,
            isDeletePoint: false,
            ...modeMap[selectMode],
        });

        toast(modeMap[selectMode]?.message || "Invalid mode selected", {
            type: "info",
            position: "top-center",
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
                    <button onClick={() => togglePastureControl(1)} disabled={modeRefs.current.isAdd} style={{ marginLeft: "0" }}>Add</button>
                    <button onClick={() => togglePastureControl(2)} disabled={modeRefs.current.isEdit}>Edit</button>
                    <button onClick={() => togglePastureControl(3)} disabled={modeRefs.current.isDelete} style={{ marginRight: "0" }} >Delete</button>
                </div>}

                <div className="pasture-btn-group modal-btn-group">
                    {isSelectedMode && <button onClick={() => togglePastureControl(0, true)}> Go Back </button>}
                    <button className={!isSelectedMode ? 'done-btn' : undefined} onClick={() => togglePastureControl(0)}>Done</button>
                </div>

            </div>
        </div>
    )
}
