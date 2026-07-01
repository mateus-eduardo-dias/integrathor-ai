import { tool } from "ai"
import { z } from "zod"

export default {
    data: {
        get_weather: tool({
            description: 'Get the temperature of a place',
            inputSchema: z.object({
                city: z.string().describe('City name')
            }),
            execute: async () => {
                return {temperature: 22, unit: 'Celsius'}
            }
        })
    },
    saveContext: {
        get_weather: true
    }
}