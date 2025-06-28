import React, { useState } from 'react'
import './EditModeBar.css'

interface EditModeBarProps {
    modeRefs: React.MutableRefObject<{
        message?: string;
        isAdd: boolean;
        isEdit: boolean;
        isDelete: boolean;
        isAddPoint: boolean;
        isDeletePoint: boolean;
    }>;
    handleClickDone: (isModelClosed: boolean) => void;
    isDelete?: boolean;
}

/**
 * A bar of buttons that allows the user to switch between different modes of selecting a pasture.
 *
 * The bar is used to control the state of the {@link Mode} component.
 *
 * The bar is rendered as a container with a group of buttons.
 *
 * The bar is used to switch between the following modes:
 * - Adding a new pasture
 * - Editing the shape of a pasture
 * - Deleting a pasture
 * - Adding a point to a pasture
 * - Deleting a point from a pasture
 *
 * The bar is also used to go back to the previous mode.
 *
 * The bar is rendered with a message that informs the user of the current mode.
 *
 * The bar is rendered with a "Done" button that is enabled when the user is in edit mode.
 * The bar is rendered with a "Cancel" button that is enabled when the user is in any mode.
 *
 * The bar is rendered with a "Go Back" button that is enabled when the user is in any mode.
 *
 * The bar is rendered with a "Add Point" button that is enabled when the user is in edit mode.
 * The bar is rendered with a "Delete Point" button that is enabled when the user is in edit mode.
 *
 * The bar is rendered with a "Add" button that is enabled when the user is not in add mode.
 * The bar is rendered with a "Edit" button that is enabled when the user is not in edit mode.
 * The bar is rendered with a "Delete" button that is enabled when the user is not in delete mode.
 *
 * The bar is rendered with a "Done" button that is disabled when the user is not in edit mode.
 * The bar is rendered with a "Cancel" button that is disabled when the user is not in any mode.
 *
 * The bar is rendered with a "Go Back" button that is disabled when the user is not in any mode.
 *
 * The bar is rendered with a "Add Point" button that is disabled when the user is not in edit mode.
 * The bar is rendered with a "Delete Point" button that is disabled when the user is not in edit mode.
 *
 * The bar is rendered with a "Add" button that is disabled when the user is in add mode.
 * The bar is rendered with a "Edit" button that is disabled when the user is in edit mode.
 * The bar is rendered with a "Delete" button that is disabled when the user is in delete mode.
 *
 * @param {EditModeBarProps} props - The props for the component.
 * @returns {JSX.Element} - The rendered component.
 */
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

            handleClickDone(!goBack || false); 

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
            <div>
                {isSelectedMode && <h3 className="pasture-message">{modeRefs.current?.message}</h3>}
                
                {!modeRefs.current.isEdit && <div className="pasture-btn-group modal-btn-group">
                    <button onClick={() => togglePastureControl(1)} disabled={modeRefs.current.isAdd} style={{ marginLeft: "0", background: "#28a745", color: "#fff" }}>Add</button>
                    <button onClick={() => togglePastureControl(2)} disabled={modeRefs.current.isEdit}>Edit</button>
                    <button onClick={() => togglePastureControl(3)} disabled={modeRefs.current.isDelete} style={{ marginRight: "0", background: "#F44336", color: "#fff" }} >Delete</button>
                </div>}

                {modeRefs.current.isEdit && <div className="point-btn-group modal-btn-group">
                    <button onClick={() => togglePastureControl(4)} disabled={modeRefs.current.isAddPoint} style={{ background: "#4CAF50", color: "#fff" }}>Add Point</button>
                    <button onClick={() => togglePastureControl(5)} disabled={modeRefs.current.isDeletePoint} style={{ background: "#d40202", color: "#fff" }}>Delete Point</button>
                </div>}
                <div className="pasture-btn-group modal-btn-group">
                    {modeRefs.current.isEdit && <button className={'back-btn'} onClick={() => togglePastureControl(0, true)}> Go Back </button>}
                    <button className={modeRefs.current.isEdit ? 'done-btn' : 'cancel-btn'} onClick={() => togglePastureControl(0)}>{modeRefs.current.isEdit ? "Done" : "Cancel"}</button>
                </div>
            </div>
        </div>
    )
}
