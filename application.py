from flask import Flask, jsonify, request
import json
import yfinance as yf
from flask_cors import CORS, cross_origin

application = Flask(__name__)
cors = CORS(application)

stocks = ["SPY", "DOW", "FTMC", "AAPL", "LSE:TSCO", "MSCI", "GLD", "COWS"]

@application.route('/api/stocks')
@cross_origin()
def getStockList():
	return jsonify(stocks=stocks)

@application.route('/api/stock/<ticker>')
@cross_origin()
def getStockInfo(ticker):
	stock = yf.Ticker(ticker)

	infoRet = {
		"name": "Unknown",
		"description": "Unknown",
		"type": "Unknown",
		"currency": "Unknown",
	}

	info = stock.info

	if "shortName" in info:
		infoRet["name"] = info["shortName"]

	if "longBusinessSummary" in info:
		infoRet["description"] = info["longBusinessSummary"]

	if "quoteType" in info:
		infoRet["type"] = info["quoteType"]


	infoRet["currency"] = stock.history_metadata["currency"]

	return jsonify(infoRet)



@application.route('/api/stock/<ticker>/<start_date>/<end_date>')
@cross_origin()
def getStockPrices(ticker, start_date, end_date):
	stock_data_frame = yf.download(ticker, start_date, end_date)
	stock_data_frame.reset_index(inplace=True)
	stock_data_frame['Date'] = stock_data_frame['Date'].dt.strftime('%Y-%m-%d')

	stock_list = stock_data_frame.to_dict(orient='records')

	retDict = {}
	for stock in stock_list:
		retDict[stock["Date"]] = stock["Close"]

	return jsonify(data=retDict)


@application.route('/api/compound/<start_date>/<end_date>')
@cross_origin()
def calculateStockReturns(start_date, end_date):
	portfolio_input = request.args.get('portfolio')
	portfolio_dict = json.loads(portfolio_input)
	prices = {}

	tickers = list(portfolio_dict.keys())

	for ticker in tickers:
		prices[ticker] = yf.download(ticker, start_date, end_date)


	validIndexes = prices[tickers[0]].index

	currencyData = {}

	for ticker in tickers:
		data = yf.Ticker(ticker)
		currencyData[ticker] = yf.download(f"GBP{data.history_metadata['currency']}=X", start_date, end_date)


	for ticker in tickers:
		index = prices[ticker].index
		validIndexes = validIndexes.intersection(index)
		index = currencyData[ticker].index
		validIndexes = validIndexes.intersection(index)


	retDict = {}


	numSharesBought = {}
	for ticker in tickers:
		index = validIndexes[0]

		numSharesBought[ticker] = (portfolio_dict[ticker] * currencyData[ticker].loc[index]["Close"]) / prices[ticker].loc[index]["Close"]


	for index in validIndexes:
		total = 0
		dictForDate = {}
		for ticker in tickers:
			price = prices[ticker].loc[index]["Close"]
			position_value = (price * numSharesBought[ticker]) / currencyData[ticker].loc[index]["Close"]
			total += position_value
			dictForDate[ticker] = position_value
		dictForDate["total"] = total
		retDict[index.strftime('%Y-%m-%d')] = dictForDate


	return jsonify(data=retDict)


if __name__ == "__main__":
    # Setting debug to True enables debug output. This line should be
    # removed before deploying a production application.
    application.run()
