

// export const HOST = "/api/"
export const HOST = "http://127.0.0.1:8000/"



export async function call(handler, data, auth=null) {
    var headers = {
        'Content-Type': 'application/json', 
    }

    if (auth != null) {
        headers["Authorization"] = "Bearer " + auth
    }

    let resp = await fetch(HOST + handler, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
    })

    // console.log(resp);
    if (resp.status == 404) {
        return {"error": 404}
    }

    resp = await resp.json()
    
    return resp;
}
