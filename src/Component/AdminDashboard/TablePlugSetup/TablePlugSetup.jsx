import React, { useState } from 'react';
import Tables from './Tables';
import MapSmartPlug from './MapSmartPlug';

function TablePlugSetup() {
    return (
        <div className="p-3">
            {/* Main Content */}
            <div className="">
                <div className="mb-4">
                    <h1 className="fs-3 fw-bold text-dark">Table & Plug Setup</h1>
                    <p className="text-muted">Manage table types, configure rates, and control smart plugs</p>
                </div>

                <div className="row g-4">
                    <div>
                        <Tables />
                    </div>

                    <div>
                        <MapSmartPlug />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TablePlugSetup;
