export default class ImageCache
{
    private static imageMap: Map<string, HTMLImageElement> = new Map();

    public static invalidateImage(filename: string)
    {
        this.imageMap.delete(filename);
    }

    public static invalidateAll(): void
    {
        this.imageMap.clear();
    }

    public static fetchImage(filename: string)
    {
        this.getImage(filename, () => {});
    }

    public static getImage(filename: string, callback: (image: HTMLImageElement, wasCached: boolean) => any)
    {
        if (this.imageMap.has(filename))
        {
            callback(this.imageMap.get(filename) as HTMLImageElement, true);
        }
        else
        {
            const img = new Image();
            this.imageMap.set(filename, img);
            img.onload = () =>
            {
                callback(img, false);
            };
            img.src = filename;
        }
    }
}