import React from 'react'


function addSeparator(array, separator) {
    if (!Array.isArray(array)) {
        return array
    }

    let result = [];
    for (let i = 0; i < array.length - 1; i++) {
        result.push(array[i], separator)
    }
    result.push(array[array.length - 1])

    return result;
}

export function Breadcrumbs(props) {

    let children = addSeparator(props.children, <div className="py-6 sm:py-6 md:py-8 lg:py-10 pb-4">/</div>)
    let username = props.username;

    return (
        <div key="breadcrumbs" className="
                mb-9 flex flex-row gap-4 font-bold flex-wrap
                text-2xl sm:text-3xl md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl">
            {children}

            <div className="flex-grow" />
            <div className="flex flex-col font-normal justify-end">
                <div className='flex flex-row gap-4'>
                    <span className='p-4 flex flex-row justify-center rounded-xl text-2xl
                bg-light-secondaryContainer text-light-onSecondaryContainer dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer
                '>

                        {/* <div className="flex text-sm md:text-lg flex-col md:flex-row gap-2 justify-center"> */}
                        {/* <span>
                        {props.children}
                        </span> */}
                        {/* </div> */}

                        <div className="text-center align-middle flex justify-center flex-col pb-1">
                            @{username}
                        </div>



                        {/* <h1 className="text-2xl align-center pt-2"></h1> */}
                    </span>

                    <a href='/' className='p-4 flex flex-row justify-center rounded-xl text-2xl
                    bg-light-secondaryContainer text-light-onSecondaryContainer dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer
                    hover:bg-light-secondaryFixedDim dark:hover:bg-dark-surfaceVariant'>
                        <div className="text-center align-middle flex justify-center flex-col scale-90 pl-2 pr-1">
                            <span class="material-symbols-outlined">logout</span>
                        </div>

                    </a>
                </div>
            </div>
        </div>
    )
}

export function Breadcrumb(props) {
    return (
        <a href={props.href} className='
        p-6 sm:p-6 md:p-8 lg:p-10
        bg-light-secondaryContainer text-light-onSecondaryContainer dark:bg-dark-secondaryContainer dark:text-dark-onSecondaryContainer
        hover:bg-light-secondaryFixedDim dark:hover:bg-dark-surfaceVariant
        rounded-xl duration-200 hover:shadow-md
        flex justify-self-stretch
        whitespace-nowrap
        z-50
        '>
            {props.children}
        </a>
    )
}

export default Breadcrumbs;