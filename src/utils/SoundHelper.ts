import ObjectHelper from "./ObjectHelper";
import { SoundModel } from "./datatypes";
import * as fs from "fs";
import PathHelper from "./PathHelper";

export default class SoundHelper
{
    private static soundCache = new Map<number, AudioBuffer>();
    private static audioContext = new AudioContext();
    private static channels = new Set<AudioBufferSourceNode>();

    public static async updateCache()
    {
        this.soundCache.clear();
        
        this.channels.forEach((channel) =>
        {
            channel.stop();
        });
        
        this.channels.clear();

        const sounds = ObjectHelper.getObjectsWithType<SoundModel>("sound");

        // TODO: parallelize this
        for (const sound of sounds)
        {
            if (sound.path)
            {
                const buffer = fs.readFileSync(PathHelper.resolveObjectFileName(sound.path));
                const audioBuffer = await this.audioContext.decodeAudioData(buffer.buffer);
                this.soundCache.set(sound.id, audioBuffer);
            }
        }
    }

    public static playSoundById(id: number, position?: number)
    {
        const audioBuffer = this.soundCache.get(id);

        if (audioBuffer)
        {
            const trackSource = this.audioContext.createBufferSource();
            trackSource.buffer = audioBuffer;
            trackSource.connect(this.audioContext.destination);
            trackSource.start(0, position);

            trackSource.addEventListener("ended", (e) =>
            {
                this.channels.delete(trackSource);
            });
            
            this.channels.add(trackSource);
        }
        else
        {
            throw new Error("sound not cached: " + id);
        }
    }

    public static playSoundsByIds(ids: number[])
    {
        for (const id of ids)
        {
            this.playSoundById(id);
        }
    }

    public static stopAll()
    {
        this.channels.forEach((channel) =>
        {
            channel.stop();
        });
    }
}