import puppeteer from "puppeteer"
import { getShoeObject, getAllKeys, getPage } from "../utils/utils.js"
import dotenv from "dotenv"
import jsonData from "./uuidJson.js"

dotenv.config()

export default (clientClass) => getAllKeys(jsonData).forEach(key => {
	(async (key) => {

		const shoeObject = getShoeObject(key, jsonData)
		const webPage = getShoeWeb(shoeObject.uuid)
		const browser = await puppeteer.launch(
			{
				args: [process.env.ROTATING_PROXY_URL],
			}
		)
		const page = await getPage(browser)

		await page.goto(webPage, { waitUntil: "domcontentloaded" })
		await page.waitForSelector("[type=\"button\"]")

		const shoesArr = await page.evaluate((webPage) => {
			try {
				const allElements = document.querySelectorAll("[type=\"button\"]")
				return Array.from(allElements)
					.filter(el => !el.innerHTML.includes("noStockOverlay"))
					.map((el) => {
						return {
							link: webPage,
							size: el.textContent.replace(/[^\d.]/g, ""),
							image: document.querySelector(".imgMed").src,
							price: document.querySelector(".pri").textContent.trim()//itemPrices
						}
					})
			} catch (error) {
				return {
					error: error
				}
			}
		}, (webPage))

		if (shoesArr.error) clientClass.sendErrorLog(`Error while searching for property in ${shoeObject.name} UUID ${shoeObject.uuid}`)

		shoesArr.forEach((shoe) => {
			const object = { ...shoe, ...shoeObject }
			clientClass.sendTheMsg(object, "1070371512860819507")
		})

		await browser.close()
	})(key)
})

function getShoeWeb(uuid) {
	return `https://www.jdsports.es/product/!/${uuid}_jdsportses/`
}

