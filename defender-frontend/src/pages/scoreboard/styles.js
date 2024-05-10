


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
                padding: 1rem 0rem 1rem 0rem;
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
                
                // transform: rotate(-45deg);
                // margin-bottom: 50%;
            }

            th.rotate > div {
                position: absolute;
                transform: rotate(-45deg);
                bottom: 0;
                left: 0;
                margin-left: 100%;
            }
            th.rotate > div > span {
                position: absolute;
                bottom: 0;
                left: 0;
                border-bottom: 1px solid gray;
                padding: 5px 10px;
            }
            .stripes {
                background-image: 
                    repeating-linear-gradient(
                        -45deg, 
                        transparent, 
                        transparent 1rem,
                        rgb(96 165 250) 1rem,
                        rgb(96 165 250) 2rem
                    );
                background-size: 200% 200%;
                animation: barberpole 5s linear infinite;
            }
                
            @keyframes barberpole {
                100% {
                    background-position: 100% 100%;
                }
            }
            
            .score {
                min-width: 9rem;
            }

            .deactivated {
                background: repeating-linear-gradient(
                    45deg,
                    rgba(0, 0, 0, 0.0),
                    rgba(0, 0, 0, 0.0) 10px,
                    rgba(0, 0, 0, 0.1) 10px,
                    rgba(0, 0, 0, 0.1) 20px
                  );
                // background: black;
            }
            `}
        </style>
    )
}

export default Styles;
