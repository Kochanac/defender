


function Styles() {
    return (
        <style>{`
            .App {
                padding: 1rem !important;
            }
            
            .giga-container {
                /* padding: 1rem !important; */
                width: 90% !important;
                padding-top: 4rem !important;
            }

            td {
                // padding: 1rem;
                border-right: 1px solid gray;
                width: 6rem;
                min-width: 6rem;
                max-width: 6rem;
                height: 6rem;
                min-height: 6rem;
                max-height: 6rem;
                // width: 10%;
                // position: relative;
            }
            .long {
                // padding: 1rem 0rem 1rem 0rem;
                max-width: fit-content;
                min-width: fit-content;
                width: fit-content;
                border: 0;
            }
            .long2 {
                max-width: fit-content;
                min-width: fit-content;
                width: fit-content;
                border: 0;
            }

            th.rotate {
                height: 140px;
                white-space: nowrap;
                position: relative;
                width: auto;
                z-index: 0;
                
                // transform: rotate(-45deg);
                // margin-bottom: 50%;
            }

            th.rotate > div {
                position: absolute;
                z-index: -10;
                transform: rotate(-45deg);
                bottom: 0;
                left: 0;
                margin-left: 100%;
            }
            th.rotate > div > span {
                position: absolute;
                z-index: -10;
                bottom: 0;
                left: 0;
                border-bottom: 1px solid gray;
                padding: 5px 10px;
            }
            `}
        </style>
    )
}

export default Styles;
