import React from 'react'


export function Navbar(props) {

    let children = props.children

    return (
        <div className='bg-light-secondaryContainer dark:bg-dark-secondaryContainer z-40 rounded-full mb-6
        w-full 2xl:w-3/5 xl:w-3/4 lg:w-3/4 md:w-5/6 sm:w-full'>

            <nav className="w-auto grid grid-flow-col gap-1 justify-items-stretch">
                {children}
            </nav>
        </div>
    )
}

export function NavbarEntry(props) {
    if (props.icon != null) {
        return (
            <a className={"p-4 py-6 block z-50 rounded-full text-center text-lg font-semibold  " + (
                props.active ?
                    " bg-light-primary text-light-onPrimary dark:bg-dark-primary dark:text-dark-onPrimary"
                    : "bg-light-secondaryContainer dark:bg-dark-secondaryContainer hover:bg-light-secondaryFixedDim dark:hover:bg-dark-surfaceVariant text-light-onSecondaryContainer dark:text-dark-onSecondaryContainer")}

                href={props.href}>

                <div className="flex text-sm md:text-lg flex-col md:flex-row gap-2 justify-center">
                    <div className="text-center align-middle flex justify-center flex-col">
                        {props.icon}
                    </div>
                    <span>
                        {props.children}
                    </span>
                </div>
            </a>
        )
    }

    return (
        <a className={"p-4 py-6 block z-50 rounded-full text-center text-lg font-semibold  " + (
            props.active ?
                " bg-light-primary text-light-onPrimary dark:bg-dark-primary dark:text-dark-onPrimary"
                : "bg-light-secondaryContainer dark:bg-dark-secondaryContainer hover:bg-light-secondaryFixedDim dark:hover:bg-dark-surfaceVariant text-light-onSecondaryContainer dark:text-dark-onSecondaryContainer")}

            href={props.href}>
            {props.children}
        </a>
    )
}
