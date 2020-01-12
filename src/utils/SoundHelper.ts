import ObjectHelper from "./ObjectHelper";
import { SoundModel } from "./datatypes";
import * as fs from "fs";

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
            channel.disconnect(this.audioContext.destination);
        });
        
        this.channels.clear();

        const sounds = ObjectHelper.getObjectsWithType<SoundModel>("sound");

        // TODO: parallelize this
        for (const sound of sounds)
        {
            const buffer = fs.readFileSync(sound.path);
            const audioBuffer = await this.audioContext.decodeAudioData(buffer.buffer);
            this.soundCache.set(sound.id, audioBuffer);
        }
    }

    public static playSoundById(id: number, channel: number)
    {
        const audioBuffer = this.soundCache.get(id);

        if (audioBuffer)
        {
            const trackSource = this.audioContext.createBufferSource();
            trackSource.buffer = audioBuffer;
            trackSource.connect(this.audioContext.destination);
            trackSource.start();

            trackSource.addEventListener("ended", (e) =>
            {
                trackSource.disconnect(this.audioContext.destination);
                this.channels.delete(trackSource);
            });
            
            this.channels.add(trackSource);
        }
        else
        {
            throw new Error("sound not cached: " + id);
        }
    }

    public static playSoundsByIds(infos: { id: number, channel: number }[])
    {
        for (const { id, channel } of infos)
        {
            this.playSoundById(id, channel);
        }
    }
}