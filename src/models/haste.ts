export default async function haste(code: string) {
    for (const url of ['https://hst.sh', 'https://hastebin.com', 'https://haste.clicksminuteper.net', 'https://haste.tyman.tech']) {
        try {
            const resp = await (
                await fetch(url + '/documents', {
                    body: code,
                    method: 'POST',
                })
            ).json();
            return `${url}/${resp.key}`;
        } catch (error) {
            console.error(error);
            continue;
        }
    }
    return `Can't haste code anywhere.`;
}
