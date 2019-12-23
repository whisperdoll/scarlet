import { ProjectModel, SpriteModel } from "./datatypes";
import * as fs from "fs";
import PathHelper from "./PathHelper";

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
            img.src = PathHelper.resolveObjectFileName(filename);
        }
    }

    public static getImageSync(filename: string): HTMLImageElement
    {
        const ret = this.imageMap.get(filename);
        if (ret) return ret;
        
        const buffer = fs.readFileSync(PathHelper.resolveObjectFileName(filename));
        const img = new Image();
        img.src = "data:image/jpeg;base64," + buffer.toString("base64");
        this.imageMap.set(filename, img);
        return img;
    }

    public static updateCache(project: ProjectModel)
    {
        this.invalidateAll();

        project.objects.forEach((obj) =>
        {
            if (obj.type === "sprite" || obj.type === "background")
            {
                this.getImageSync((obj as any).path);
            }
        });
    }
}