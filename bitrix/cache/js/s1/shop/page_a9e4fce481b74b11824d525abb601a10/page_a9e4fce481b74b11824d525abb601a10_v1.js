
; /* Start:"a:4:{s:4:"full";s:93:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/script.js?154445784238253";s:6:"source";s:77:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/

BasketPoolQuantity = function()
{
	this.processing = false;
	this.poolQuantity = {};
	this.updateTimer = null;
	this.currentQuantity = {};
	this.lastStableQuantities = {};

	this.updateQuantity();
};


BasketPoolQuantity.prototype.updateQuantity = function()
{
	var items = BX('basket_items');

	if (basketJSParams['USE_ENHANCED_ECOMMERCE'] === 'Y')
	{
		checkAnalytics(this.lastStableQuantities, items);
	}

	if (!!items && items.rows.length > 0)
	{
		for (var i = 1; items.rows.length > i; i++)
		{
			var itemId = items.rows[i].id;
			this.currentQuantity[itemId] = BX('QUANTITY_' + itemId).value;
		}
	}

	this.lastStableQuantities = BX.clone(this.currentQuantity, true);
};


BasketPoolQuantity.prototype.changeQuantity = function(itemId)
{
	var quantity = BX('QUANTITY_' + itemId).value;
	var isPoolEmpty = this.isPoolEmpty();

	if (this.currentQuantity[itemId] && this.currentQuantity[itemId] != quantity)
	{
		this.poolQuantity[itemId] = this.currentQuantity[itemId] = quantity;
	}

	if (!isPoolEmpty)
	{
		this.enableTimer(true);
	}
	else
	{
		this.trySendPool();
	}
};


BasketPoolQuantity.prototype.trySendPool = function()
{
	if (!this.isPoolEmpty() && !this.isProcessing())
	{
		this.enableTimer(false);
		recalcBasketAjax({});
	}
};

BasketPoolQuantity.prototype.isPoolEmpty = function()
{
	return ( Object.keys(this.poolQuantity).length == 0 );
};

BasketPoolQuantity.prototype.clearPool = function()
{
	this.poolQuantity = {};
};

BasketPoolQuantity.prototype.isProcessing = function()
{
	return (this.processing === true);
};

BasketPoolQuantity.prototype.setProcessing = function(value)
{
	this.processing = (value === true);
};

BasketPoolQuantity.prototype.enableTimer = function(value)
{
	clearTimeout(this.updateTimer);
	if (value === false)
		return;

	this.updateTimer = setTimeout(function(){ basketPoolQuantity.trySendPool(); }, 1500);
};

/**
 * @param basketItemId
 * @param {{BASKET_ID : string, BASKET_DATA : { GRID : { ROWS : {} }}, COLUMNS: {}, PARAMS: {}, DELETE_ORIGINAL : string }} res
 */
function updateBasketTable(basketItemId, res)
{
	var table = BX("basket_items"),
		rows,
		newBasketItemId,
		arItem,
		lastRow,
		newRow,
		arColumns,
		bShowDeleteColumn = false,
		bShowDelayColumn = false,
		bShowPropsColumn = false,
		bShowPriceType = false,
		bUseFloatQuantity,
		origBasketItem,
		oCellMargin,
		i,
		oCellName,
		imageURL,
		cellNameHTML,
		oCellItem,
		cellItemHTML,
		bSkip,
		j,
		val,
		propId,
		arProp,
		bIsImageProperty,
		countValues,
		full,
		fullWidth,
		itemWidth,
		arVal,
		valId,
		arSkuValue,
		selected,
		valueId,
		k,
		arItemProp,
		oCellQuantity,
		oCellQuantityHTML,
		ratio,
		isUpdateQuantity,
		oldQuantity,
		oCellPrice,
		fullPrice,
		id,
		oCellDiscount,
		oCellWeight,
		oCellCustom,
		customColumnVal,
		propsMap,
		selectedIndex,
		counter,
		marginLeft,
		createNewItem;

	if (!table || typeof res !== 'object')
	{
		return;
	}

	rows = table.rows;
	lastRow = rows[rows.length - 1];
	bUseFloatQuantity = (res.PARAMS.QUANTITY_FLOAT === 'Y');

	// insert new row instead of original basket item row
	if (basketItemId !== null && !!res.BASKET_DATA)
	{
		origBasketItem = BX(basketItemId);

		newBasketItemId = res.BASKET_ID;
		createNewItem = BX.type.isPlainObject(res.BASKET_DATA.GRID.ROWS[newBasketItemId]);
		if (createNewItem)
		{
			arItem = res.BASKET_DATA.GRID.ROWS[newBasketItemId];
			newRow = document.createElement('tr');

			newRow.setAttribute('id', res.BASKET_ID);
			newRow.setAttribute('data-item-name', arItem['NAME']);
			newRow.setAttribute('data-item-brand', arItem[basketJSParams['BRAND_PROPERTY'] + '_VALUE']);
			newRow.setAttribute('data-item-price', arItem['PRICE']);
			newRow.setAttribute('data-item-currency', arItem['CURRENCY']);

			lastRow.parentNode.insertBefore(newRow, origBasketItem.nextSibling);
		}

		if (res.DELETE_ORIGINAL === 'Y')
		{
			origBasketItem.parentNode.removeChild(origBasketItem);
		}

		if (createNewItem)
		{
			// fill row with fields' values
			oCellMargin = newRow.insertCell(-1);
			oCellMargin.setAttribute('class', 'margin');

			arColumns = res.COLUMNS.split(',');

			for (i = 0; i < arColumns.length; i++)
			{
				if (arColumns[i] === 'DELETE')
				{
					bShowDeleteColumn = true;
				}
				else if (arColumns[i] === 'DELAY')
				{
					bShowDelayColumn = true;
				}
				else if (arColumns[i] === 'PROPS')
				{
					bShowPropsColumn = true;
				}
				else if (arColumns[i] === 'TYPE')
				{
					bShowPriceType = true;
				}
			}

			for (i = 0; i < arColumns.length; i++)
			{
				switch (arColumns[i])
				{
					case 'PROPS':
					case 'DELAY':
					case 'DELETE':
					case 'TYPE':
						break;
					case 'NAME':
						// first <td> - image and brand
						oCellName = newRow.insertCell(-1);
						imageURL = '';
						cellNameHTML = '';

						oCellName.setAttribute('class', 'itemphoto');

						if (arItem.PREVIEW_PICTURE_SRC.length > 0)
						{
							imageURL = arItem.PREVIEW_PICTURE_SRC;
						}
						else if (arItem.DETAIL_PICTURE_SRC.length > 0)
						{
							imageURL = arItem.DETAIL_PICTURE_SRC;
						}
						else
						{
							imageURL = basketJSParams.TEMPLATE_FOLDER + '/images/no_photo.png';
						}

						if (arItem.DETAIL_PAGE_URL.length > 0)
						{
							cellNameHTML = '<div class="bx_ordercart_photo_container">\
							<a href="' + arItem.DETAIL_PAGE_URL + '">\
								<div class="bx_ordercart_photo" style="background-image:url(\'' + imageURL + '\')"></div>\
							</a>\
						</div>';
						}
						else
						{
							cellNameHTML = '<div class="bx_ordercart_photo_container">\
							<div class="bx_ordercart_photo" style="background-image:url(\'' + imageURL + '\')"></div>\
						</div>';
						}

						if (arItem.BRAND && arItem.BRAND.length > 0)
						{
							cellNameHTML += '<div class="bx_ordercart_brand">\
							<img alt="" src="' + arItem.BRAND + '"/>\
						</div>';
						}

						oCellName.innerHTML = cellNameHTML;

						// second <td> - name, basket props, sku props
						oCellItem = newRow.insertCell(-1);
						cellItemHTML = '';
						oCellItem.setAttribute('class', 'item');

						if (arItem['DETAIL_PAGE_URL'].length > 0)
							cellItemHTML += '<h2 class="bx_ordercart_itemtitle"><a href="' + arItem['DETAIL_PAGE_URL'] + '">' + arItem['NAME'] + '</a></h2>';
						else
							cellItemHTML += '<h2 class="bx_ordercart_itemtitle">' + arItem['NAME'] + '</h2>';

						cellItemHTML += '<div class="bx_ordercart_itemart">';

						if (bShowPropsColumn)
						{
							for (j = 0; j < arItem['PROPS'].length; j++)
							{
								val = arItem['PROPS'][j];

								if (arItem.SKU_DATA)
								{
									bSkip = false;
									for (propId in arItem.SKU_DATA)
									{
										if (arItem.SKU_DATA.hasOwnProperty(propId))
										{
											arProp = arItem.SKU_DATA[propId];

											if (arProp['CODE'] === val['CODE'])
											{
												bSkip = true;
												break;
											}
										}
									}
									if (bSkip)
										continue;
								}

								cellItemHTML += BX.util.htmlspecialchars(val['NAME']) + ':&nbsp;<span>' + val['VALUE'] + '</span><br/>';
							}
						}
						cellItemHTML += '</div>';

						if (arItem.SKU_DATA)
						{
							propsMap = {};
							for (k = 0; k < arItem['PROPS'].length; k++)
							{
								arItemProp = arItem['PROPS'][k];
								propsMap[arItemProp['CODE']] = (BX.type.isNotEmptyString(arItemProp['~VALUE']) ? arItemProp['~VALUE'] : arItemProp['VALUE']);
							}
							for (propId in arItem.SKU_DATA)
							{
								if (arItem.SKU_DATA.hasOwnProperty(propId))
								{
									selectedIndex = 0;
									arProp = arItem.SKU_DATA[propId];
									bIsImageProperty = false;
									countValues = BX.util.array_keys(arProp['VALUES']).length;
									if (countValues > 5)
									{
										full = 'full';
										fullWidth = (countValues*20) + '%';
										itemWidth = (100/countValues) + '%';
									}
									else
									{
										full = '';
										fullWidth = '100%';
										itemWidth = '20%';
									}

									counter = 0;
									for (valId in arProp['VALUES'])
									{
										counter++;
										arVal = arProp['VALUES'][valId];
										if (BX.type.isNotEmptyString(propsMap[arProp['CODE']]))
										{
											if (propsMap[arProp['CODE']] == arVal['NAME'] || propsMap[arProp['CODE']] == arVal['XML_ID'])
												selectedIndex = counter;
										}
										if (!!arVal && typeof arVal === 'object' && !!arVal['PICT'])
										{
											bIsImageProperty = true;
										}
									}

									marginLeft = '0';
									if (full !== '' && selectedIndex > 5)
										marginLeft = ((5 - selectedIndex) * 20) + '%';

									// sku property can contain list of images or values
									if (bIsImageProperty)
									{
										cellItemHTML += '<div class="bx_item_detail_scu_small_noadaptive ' + full + '">';
										cellItemHTML += '<span class="bx_item_section_name_gray">' + BX.util.htmlspecialchars(arProp['NAME']) + '</span>';
										cellItemHTML += '<div class="bx_scu_scroller_container">';
										cellItemHTML += '<div class="bx_scu">';

										cellItemHTML += '<ul id="prop_' + arProp['CODE'] + '_' + arItem['ID'] + '" style="width: ' + fullWidth + '; margin-left: ' + marginLeft + ';" class="sku_prop_list">';

										counter = 0;
										for (valueId in arProp['VALUES'])
										{
											counter++;
											arSkuValue = arProp['VALUES'][valueId];
											selected = (selectedIndex == counter ? ' bx_active' : '');

											cellItemHTML += '<li style="width: ' + itemWidth + '; padding-top: ' + itemWidth + ';"\
															class="sku_prop' + selected + '" \
															data-sku-selector="Y" \
															data-value-id="' + arSkuValue['XML_ID'] + '" \
															data-sku-name="' + BX.util.htmlspecialchars(arSkuValue['NAME']) + '" \
															data-element="' + arItem['ID'] + '" \
															data-property="' + arProp['CODE'] + '"\
															>\
															<a href="javascript:void(0)" class="cnt"><span class="cnt_item" style="background-image:url(' + arSkuValue['PICT']['SRC'] + '"></span></a>\
														</li>';
										}

										cellItemHTML += '</ul>';
										cellItemHTML += '</div>';

										cellItemHTML += '<div class="bx_slide_left" onclick="leftScroll(\'' + arProp['CODE'] + '\', ' + arItem['ID'] + ', ' + BX.util.array_keys(arProp['VALUES']).length + ');"></div>';
										cellItemHTML += '<div class="bx_slide_right" onclick="rightScroll(\'' + arProp['CODE'] + '\', ' + arItem['ID'] + ', ' + BX.util.array_keys(arProp['VALUES']).length + ');"></div>';

										cellItemHTML += '</div>';
										cellItemHTML += '</div>';
									}
									else // not image
									{
										cellItemHTML += '<div class="bx_item_detail_size_small_noadaptive ' + full + '">';
										cellItemHTML += '<span class="bx_item_section_name_gray">' + BX.util.htmlspecialchars(arProp['NAME']) + '</span>';
										cellItemHTML += '<div class="bx_size_scroller_container">';
										cellItemHTML += '<div class="bx_size">';

										cellItemHTML += '<ul id="prop_' + arProp['CODE'] + '_' + arItem['ID'] + '" style="width: ' + fullWidth + '; margin-left: ' + marginLeft + ';" class="sku_prop_list">';

										counter = 0;
										for (valueId in arProp['VALUES'])
										{
											counter++;
											arSkuValue = arProp['VALUES'][valueId];
											selected = (selectedIndex == counter ? ' bx_active' : '');

											cellItemHTML += '<li style="width: ' + itemWidth + ';"\
															class="sku_prop ' + selected + '" \
															data-sku-selector="Y" \
															data-value-id="' + (arProp['TYPE'] === 'S' && arProp['USER_TYPE'] === 'directory' ? arSkuValue['XML_ID'] : BX.util.htmlspecialchars(arSkuValue['NAME'])) + '" \
															data-sku-name="' + BX.util.htmlspecialchars(arSkuValue['NAME']) + '" \
															data-element="' + arItem['ID'] + '" \
															data-property="' + arProp['CODE'] + '" \
															>\
															<a href="javascript:void(0)" class="cnt">' + BX.util.htmlspecialchars(arSkuValue['NAME']) + '</a>\
														</li>';
										}

										cellItemHTML += '</ul>';
										cellItemHTML += '</div>';

										cellItemHTML += '<div class="bx_slide_left" onclick="leftScroll(\'' + arProp['CODE'] + '\', ' + arItem['ID'] + ', ' + BX.util.array_keys(arProp['VALUES']).length + ');"></div>';
										cellItemHTML += '<div class="bx_slide_right" onclick="rightScroll(\'' + arProp['CODE'] + '\', ' + arItem['ID'] + ', ' + BX.util.array_keys(arProp['VALUES']).length + ');"></div>';

										cellItemHTML += '</div>';
										cellItemHTML += '</div>';
									}
								}
							}
						}

						oCellItem.innerHTML = cellItemHTML;
						break;
					case 'QUANTITY':
						oCellQuantity = newRow.insertCell(-1);
						oCellQuantityHTML = '';
						ratio = (parseFloat(arItem['MEASURE_RATIO']) > 0) ? arItem['MEASURE_RATIO'] : 1;

						isUpdateQuantity = false;

						if (ratio != 0 && ratio != '')
						{
							oldQuantity = arItem['QUANTITY'];
							arItem['QUANTITY'] = getCorrectRatioQuantity(arItem['QUANTITY'], ratio, bUseFloatQuantity);

							if (oldQuantity != arItem['QUANTITY'])
							{
								isUpdateQuantity = true;
							}
						}

						oCellQuantity.setAttribute('class', 'custom');
						oCellQuantityHTML += '<span>' + getColumnName(res, arColumns[i]) + ':</span>';

						oCellQuantityHTML += '<div class="centered">';
						oCellQuantityHTML += '<table cellspacing="0" cellpadding="0" class="counter">';
						oCellQuantityHTML += '<tr>';
						oCellQuantityHTML += '<td>';

						oCellQuantityHTML += '<input type="text" size="3" id="QUANTITY_INPUT_' + arItem['ID'] + '"\
											name="QUANTITY_INPUT_' + arItem['ID'] + '"\
											style="max-width: 50px"\
											value="' + arItem['QUANTITY'] + '"\
											onchange="updateQuantity(\'QUANTITY_INPUT_' + arItem['ID'] + '\',\'' + arItem['ID'] + '\', ' + ratio + ',' + bUseFloatQuantity + ')"\
						>';

						oCellQuantityHTML += '</td>';

						if (ratio != 0
							&& ratio != ''
						) // if not Set parent, show quantity control
						{
							oCellQuantityHTML += '<td id="basket_quantity_control">\
							<div class="basket_quantity_control">\
								<a href="javascript:void(0);" class="plus" onclick="setQuantity(' + arItem['ID'] + ', ' + ratio + ', \'up\', ' + bUseFloatQuantity + ');"></a>\
								<a href="javascript:void(0);" class="minus" onclick="setQuantity(' + arItem['ID'] + ', ' + ratio + ', \'down\', ' + bUseFloatQuantity + ');"></a>\
							</div>\
						</td>';
						}

						if (arItem.hasOwnProperty('MEASURE_TEXT') && arItem['MEASURE_TEXT'].length > 0)
							oCellQuantityHTML += '<td style="text-align: left">' + BX.util.htmlspecialchars(arItem['MEASURE_TEXT']) + '</td>';

						oCellQuantityHTML += '</tr>';
						oCellQuantityHTML += '</table>';
						oCellQuantityHTML += '</div>';

						oCellQuantityHTML += '<input type="hidden" id="QUANTITY_' + arItem['ID'] + '" name="QUANTITY_' + arItem['ID'] + '" value="' + arItem['QUANTITY'] + '" />';

						oCellQuantity.innerHTML = oCellQuantityHTML;

						if (isUpdateQuantity)
						{
							updateQuantity('QUANTITY_INPUT_' + arItem['ID'], arItem['ID'], ratio, bUseFloatQuantity);
						}
						break;
					case 'PRICE':
						oCellPrice = newRow.insertCell(-1);
						fullPrice = (arItem['DISCOUNT_PRICE_PERCENT'] > 0) ? arItem['FULL_PRICE_FORMATED'] : '';

						oCellPrice.setAttribute('class', 'price');
						oCellPrice.innerHTML = '<div class="current_price" id="current_price_' + arItem['ID'] + '">' + arItem['PRICE_FORMATED'] + '</div>' +
							'<div class="old_price" id="old_price_' + arItem['ID'] + '">' + fullPrice + '</div>';

						if (bShowPriceType && arItem['NOTES'].length > 0)
						{
							oCellPrice.innerHTML += '<div class="type_price">' + basketJSParams['SALE_TYPE'] + '</div>';
							oCellPrice.innerHTML += '<div class="type_price_value">' + arItem['NOTES'] + '</div>';
						}
						break;
					case 'DISCOUNT':
						oCellDiscount = newRow.insertCell(-1);
						oCellDiscount.setAttribute('class', 'custom');
						oCellDiscount.innerHTML = '<span>' + getColumnName(res, arColumns[i]) + ':</span>';
						oCellDiscount.innerHTML += '<div id="discount_value_' + arItem['ID'] + '">' + arItem['DISCOUNT_PRICE_PERCENT_FORMATED'] + '</div>';
						break;
					case 'WEIGHT':
						oCellWeight = newRow.insertCell(-1);
						oCellWeight.setAttribute('class', 'custom');
						oCellWeight.innerHTML = '<span>' + getColumnName(res, arColumns[i]) + ':</span>';
						oCellWeight.innerHTML += arItem['WEIGHT_FORMATED'];
						break;
					default:
						oCellCustom = newRow.insertCell(-1);
						customColumnVal = '';

						oCellCustom.setAttribute('class', 'custom');
						oCellCustom.innerHTML = '<span>' + getColumnName(res, arColumns[i]) + ':</span>';

						if (arColumns[i] == 'SUM')
							customColumnVal += '<div id="sum_' + arItem['ID'] + '">';

						if (typeof(arItem[arColumns[i]]) != 'undefined')
						{
							customColumnVal += arItem[arColumns[i]];
						}

						if (arColumns[i] == 'SUM')
							customColumnVal += '</div>';

						oCellCustom.innerHTML += customColumnVal;
						break;
				}
			}

			if (bShowDeleteColumn || bShowDelayColumn)
			{
				var oCellControl = newRow.insertCell(-1);
				oCellControl.setAttribute('class', 'control');

				if (bShowDeleteColumn)
					oCellControl.innerHTML = '<a href="' + basketJSParams['DELETE_URL'].replace('#ID#', arItem['ID']) + '">' + basketJSParams['SALE_DELETE'] + '</a><br />';

				if (bShowDelayColumn)
					oCellControl.innerHTML += '<a href="' + basketJSParams['DELAY_URL'].replace('#ID#', arItem['ID']) + '">' + basketJSParams['SALE_DELAY'] + '</a>';
			}

			var oCellMargin2 = newRow.insertCell(-1);
			oCellMargin2.setAttribute('class', 'margin');
		}
	}

	// update product params after recalculation
	if (!!res.BASKET_DATA)
	{
		for (id in res.BASKET_DATA.GRID.ROWS)
		{
			if (res.BASKET_DATA.GRID.ROWS.hasOwnProperty(id))
			{
				var item = res.BASKET_DATA.GRID.ROWS[id];

				if (BX('discount_value_' + id))
					BX('discount_value_' + id).innerHTML = item.DISCOUNT_PRICE_PERCENT_FORMATED;

				if (BX('current_price_' + id))
					BX('current_price_' + id).innerHTML = item.PRICE_FORMATED;

				if (BX('old_price_' + id))
					BX('old_price_' + id).innerHTML = (item.DISCOUNT_PRICE_PERCENT > 0) ? item.FULL_PRICE_FORMATED : '';

				if (BX('sum_' + id))
					BX('sum_' + id).innerHTML = item.SUM;

				// if the quantity was set by user to 0 or was too much, we need to show corrected quantity value from ajax response
				if (BX('QUANTITY_' + id))
				{
					BX('QUANTITY_INPUT_' + id).value = item.QUANTITY;
					BX('QUANTITY_INPUT_' + id).defaultValue = item.QUANTITY;

					BX('QUANTITY_' + id).value = item.QUANTITY;
				}
			}
		}
	}

	// update coupon info
	if (!!res.BASKET_DATA)
		couponListUpdate(res.BASKET_DATA);

	// update warnings if any
	if (res.hasOwnProperty('WARNING_MESSAGE'))
	{
		var warningText = '';

		for (i = res['WARNING_MESSAGE'].length - 1; i >= 0; i--)
			warningText += res['WARNING_MESSAGE'][i] + '<br/>';

		BX('warning_message').innerHTML = warningText;
	}

	// update total basket values
	if (!!res.BASKET_DATA)
	{
		if (BX('allWeight_FORMATED'))
			BX('allWeight_FORMATED').innerHTML = res['BASKET_DATA']['allWeight_FORMATED'].replace(/\s/g, '&nbsp;');

		if (BX('allSum_wVAT_FORMATED'))
			BX('allSum_wVAT_FORMATED').innerHTML = res['BASKET_DATA']['allSum_wVAT_FORMATED'].replace(/\s/g, '&nbsp;');

		if (BX('allVATSum_FORMATED'))
			BX('allVATSum_FORMATED').innerHTML = res['BASKET_DATA']['allVATSum_FORMATED'].replace(/\s/g, '&nbsp;');

		if (BX('allSum_FORMATED'))
			BX('allSum_FORMATED').innerHTML = res['BASKET_DATA']['allSum_FORMATED'].replace(/\s/g, '&nbsp;');

		if (BX('PRICE_WITHOUT_DISCOUNT'))
		{
			var showPriceWithoutDiscount = (res['BASKET_DATA']['PRICE_WITHOUT_DISCOUNT'] != res['BASKET_DATA']['allSum_FORMATED']);
			BX('PRICE_WITHOUT_DISCOUNT').innerHTML = showPriceWithoutDiscount ? res['BASKET_DATA']['PRICE_WITHOUT_DISCOUNT'].replace(/\s/g, '&nbsp;') : '';
			BX.style(BX('PRICE_WITHOUT_DISCOUNT').parentNode, 'display', (showPriceWithoutDiscount ? 'table-row' : 'none'));
		}

		BX.onCustomEvent('OnBasketChange');
	}
}
/**
 * @param couponBlock
 * @param {COUPON: string, JS_STATUS: string} oneCoupon - new coupon.
 */
function couponCreate(couponBlock, oneCoupon)
{
	var couponClass = 'disabled';

	if (!BX.type.isElementNode(couponBlock))
		return;
	if (oneCoupon.JS_STATUS === 'BAD')
		couponClass = 'bad';
	else if (oneCoupon.JS_STATUS === 'APPLYED')
		couponClass = 'good';

	couponBlock.appendChild(BX.create(
		'div',
		{
			props: {
				className: 'bx_ordercart_coupon'
			},
			children: [
				BX.create(
					'input',
					{
						props: {
							className: couponClass,
							type: 'text',
							value: oneCoupon.COUPON,
							name: 'OLD_COUPON[]'
						},
						attrs: {
							disabled: true,
							readonly: true
						}
					}
				),
				BX.create(
					'span',
					{
						props: {
							className: couponClass
						},
						attrs: {
							'data-coupon': oneCoupon.COUPON
						}
					}
				),
				BX.create(
					'div',
					{
						props: {
							className: 'bx_ordercart_coupon_notes'
						},
						html: oneCoupon.JS_CHECK_CODE
					}
				)
			]
		}
	));
}

/**
 * @param {COUPON_LIST : []} res
 */
function couponListUpdate(res)
{
	var couponBlock,
		couponClass,
		fieldCoupon,
		couponsCollection,
		couponFound,
		i,
		j,
		key;

	if (!!res && typeof res !== 'object')
	{
		return;
	}

	couponBlock = BX('coupons_block');
	if (!!couponBlock)
	{
		if (!!res.COUPON_LIST && BX.type.isArray(res.COUPON_LIST))
		{
			fieldCoupon = BX('coupon');
			if (!!fieldCoupon)
			{
				fieldCoupon.value = '';
			}
			couponsCollection = BX.findChildren(couponBlock, { tagName: 'input', property: { name: 'OLD_COUPON[]' } }, true);

			if (!!couponsCollection)
			{
				if (BX.type.isElementNode(couponsCollection))
				{
					couponsCollection = [couponsCollection];
				}
				for (i = 0; i < res.COUPON_LIST.length; i++)
				{
					couponFound = false;
					key = -1;
					for (j = 0; j < couponsCollection.length; j++)
					{
						if (couponsCollection[j].value === res.COUPON_LIST[i].COUPON)
						{
							couponFound = true;
							key = j;
							couponsCollection[j].couponUpdate = true;
							break;
						}
					}
					if (couponFound)
					{
						couponClass = 'disabled';
						if (res.COUPON_LIST[i].JS_STATUS === 'BAD')
							couponClass = 'bad';
						else if (res.COUPON_LIST[i].JS_STATUS === 'APPLYED')
							couponClass = 'good';

						BX.adjust(couponsCollection[key], {props: {className: couponClass}});
						BX.adjust(couponsCollection[key].nextSibling, {props: {className: couponClass}});
						BX.adjust(couponsCollection[key].nextSibling.nextSibling, {html: res.COUPON_LIST[i].JS_CHECK_CODE});
					}
					else
					{
						couponCreate(couponBlock, res.COUPON_LIST[i]);
					}
				}
				for (j = 0; j < couponsCollection.length; j++)
				{
					if (typeof (couponsCollection[j].couponUpdate) === 'undefined' || !couponsCollection[j].couponUpdate)
					{
						BX.remove(couponsCollection[j].parentNode);
						couponsCollection[j] = null;
					}
					else
					{
						couponsCollection[j].couponUpdate = null;
					}
				}
			}
			else
			{
				for (i = 0; i < res.COUPON_LIST.length; i++)
				{
					couponCreate(couponBlock, res.COUPON_LIST[i]);
				}
			}
		}
	}
	couponBlock = null;
}

function skuPropClickHandler()
{
	var target = this,
		basketItemId,
		property,
		property_values = {},
		postData = {},
		action_var,
		all_sku_props,
		i,
		sku_prop_value,
		m;

	if (!!target && target.hasAttribute('data-value-id'))
	{
		BX.showWait();

		basketItemId = target.getAttribute('data-element');
		property = target.getAttribute('data-property');
		action_var = BX('action_var').value;

		property_values[property] = BX.util.htmlspecialcharsback(target.getAttribute('data-value-id'));

		// if already selected element is clicked
		if (BX.hasClass(target, 'bx_active'))
		{
			BX.closeWait();
			return;
		}

		// get other basket item props to get full unique set of props of the new product
		all_sku_props = BX.findChildren(BX(basketItemId), {tagName: 'ul', className: 'sku_prop_list'}, true);
		if (!!all_sku_props && all_sku_props.length > 0)
		{
			for (i = 0; all_sku_props.length > i; i++)
			{
				if (all_sku_props[i].id !== 'prop_' + property + '_' + basketItemId)
				{
					sku_prop_value = BX.findChildren(BX(all_sku_props[i].id), {tagName: 'li', className: 'bx_active'}, true);
					if (!!sku_prop_value && sku_prop_value.length > 0)
					{
						for (m = 0; sku_prop_value.length > m; m++)
						{
							if (sku_prop_value[m].hasAttribute('data-value-id'))
							{
								property_values[sku_prop_value[m].getAttribute('data-property')] = BX.util.htmlspecialcharsback(sku_prop_value[m].getAttribute('data-value-id'));
							}
						}
					}
				}
			}
		}

		postData = {
			'basketItemId': basketItemId,
			'sessid': BX.bitrix_sessid(),
			'site_id': BX.message('SITE_ID'),
			'props': property_values,
			'action_var': action_var,
			'select_props': BX('column_headers').value,
			'offers_props': BX('offers_props').value,
			'quantity_float': BX('quantity_float').value,
			'price_vat_show_value': BX('price_vat_show_value').value,
			'hide_coupon': BX('hide_coupon').value,
			'use_prepayment': BX('use_prepayment').value
		};

		postData[action_var] = 'select_item';

		BX.ajax({
            url: '/bitrix/components/bitrix/sale.basket.basket/ajax.php',
			method: 'POST',
			data: postData,
			dataType: 'json',
			onsuccess: function(result)
			{
				BX.closeWait();
				updateBasketTable(basketItemId, result);
			}
		});
	}
}

function getColumnName(result, columnCode)
{
	if (BX('col_' + columnCode))
	{
		return BX.util.trim(BX('col_' + columnCode).innerHTML);
	}
	else
	{
		return '';
	}
}

function leftScroll(prop, id, count)
{
	count = parseInt(count, 10);
	var el = BX('prop_' + prop + '_' + id);

	if (el)
	{
		var curVal = parseInt(el.style.marginLeft, 10);
		if (curVal <= -20)
			el.style.marginLeft = curVal + 20 + '%';
	}
}

function rightScroll(prop, id, count)
{
	count = parseInt(count, 10);

	var el = BX('prop_' + prop + '_' + id);

	if (el)
	{
		var curVal = parseInt(el.style.marginLeft, 10);
		if (curVal > (5 - count)*20)
			el.style.marginLeft = curVal - 20 + '%';
	}
}

function checkOut()
{
	if (!!BX('coupon'))
		BX('coupon').disabled = true;
	BX("basket_form").submit();
	return true;
}

function updateBasket()
{
	recalcBasketAjax({});
}

function enterCoupon()
{
	var newCoupon = BX('coupon');
	if (!!newCoupon && !!newCoupon.value)
		recalcBasketAjax({'coupon' : newCoupon.value});
}

// check if quantity is valid
// and update values of both controls (text input field for PC and mobile quantity select) simultaneously
function updateQuantity(controlId, basketId, ratio, bUseFloatQuantity)
{
	var oldVal = BX(controlId).defaultValue,
		newVal = parseFloat(BX(controlId).value) || 0,
		bIsCorrectQuantityForRatio = false,
		autoCalculate = ((BX("auto_calculation") && BX("auto_calculation").value == "Y") || !BX("auto_calculation"));

	if (ratio === 0 || ratio == 1)
	{
		bIsCorrectQuantityForRatio = true;
	}
	else
	{

		var newValInt = newVal * 10000,
			ratioInt = ratio * 10000,
			reminder = newValInt % ratioInt,
			newValRound = parseInt(newVal);

		if (reminder === 0)
		{
			bIsCorrectQuantityForRatio = true;
		}
	}

	var bIsQuantityFloat = false;

	if (parseInt(newVal) != parseFloat(newVal))
	{
		bIsQuantityFloat = true;
	}

	newVal = (bUseFloatQuantity === false && bIsQuantityFloat === false) ? parseInt(newVal) : parseFloat(newVal).toFixed(4);
	newVal = correctQuantity(newVal);

	if (bIsCorrectQuantityForRatio)
	{
		BX(controlId).defaultValue = newVal;

		BX("QUANTITY_INPUT_" + basketId).value = newVal;

		// set hidden real quantity value (will be used in actual calculation)
		BX("QUANTITY_" + basketId).value = newVal;

		if (autoCalculate)
		{
			basketPoolQuantity.changeQuantity(basketId);
		}
	}
	else
	{
		newVal = getCorrectRatioQuantity(newVal, ratio, bUseFloatQuantity);
		newVal = correctQuantity(newVal);

		if (newVal != oldVal)
		{
			BX("QUANTITY_INPUT_" + basketId).value = newVal;
			BX("QUANTITY_" + basketId).value = newVal;

			if (autoCalculate)
			{
				basketPoolQuantity.changeQuantity(basketId);
			}
		}else
		{
			BX(controlId).value = oldVal;
		}
	}
}

// used when quantity is changed by clicking on arrows
function setQuantity(basketId, ratio, sign, bUseFloatQuantity)
{
	var curVal = parseFloat(BX("QUANTITY_INPUT_" + basketId).value),
		newVal;

	newVal = (sign == 'up') ? curVal + ratio : curVal - ratio;

	if (newVal < 0)
		newVal = 0;

	if (bUseFloatQuantity)
	{
		newVal = parseFloat(newVal).toFixed(4);
	}
	newVal = correctQuantity(newVal);

	if (ratio > 0 && newVal < ratio)
	{
		newVal = ratio;
	}

	if (!bUseFloatQuantity && newVal != newVal.toFixed(4))
	{
		newVal = parseFloat(newVal).toFixed(4);
	}

	newVal = getCorrectRatioQuantity(newVal, ratio, bUseFloatQuantity);
	newVal = correctQuantity(newVal);

	BX("QUANTITY_INPUT_" + basketId).value = newVal;
	BX("QUANTITY_INPUT_" + basketId).defaultValue = newVal;

	updateQuantity('QUANTITY_INPUT_' + basketId, basketId, ratio, bUseFloatQuantity);
}

function getCorrectRatioQuantity(quantity, ratio, bUseFloatQuantity)
{
	var newValInt = quantity * 10000,
		ratioInt = ratio * 10000,
		reminder = (quantity / ratio - ((quantity / ratio).toFixed(0))).toFixed(6),
		result = quantity,
		bIsQuantityFloat = false,
		i;
	ratio = parseFloat(ratio);

	if (reminder == 0)
	{
		return result;
	}

	if (ratio !== 0 && ratio != 1)
	{
		for (i = ratio, max = parseFloat(quantity) + parseFloat(ratio); i <= max; i = parseFloat(parseFloat(i) + parseFloat(ratio)).toFixed(4))
		{
			result = i;
		}

	}else if (ratio === 1)
	{
		result = quantity | 0;
	}

	if (parseInt(result, 10) != parseFloat(result))
	{
		bIsQuantityFloat = true;
	}

	result = (bUseFloatQuantity === false && bIsQuantityFloat === false) ? parseInt(result, 10) : parseFloat(result).toFixed(4);
	result = correctQuantity(result);
	return result;
}

function correctQuantity(quantity)
{
	return parseFloat((quantity * 1).toString());
}


/**
 *
 * @param {} params
 */
function recalcBasketAjax(params)
{
	if (basketPoolQuantity.isProcessing())
	{
		return false;
	}

	BX.showWait();

	var property_values = {},
		action_var = BX('action_var').value,
		items = BX('basket_items'),
		delayedItems = BX('delayed_items'),
		postData,
		i;

	postData = {
		'sessid': BX.bitrix_sessid(),
		'site_id': BX.message('SITE_ID'),
		'props': property_values,
		'action_var': action_var,
		'select_props': BX('column_headers').value,
		'offers_props': BX('offers_props').value,
		'quantity_float': BX('quantity_float').value,
		'price_vat_show_value': BX('price_vat_show_value').value,
		'hide_coupon': BX('hide_coupon').value,
		'use_prepayment': BX('use_prepayment').value
	};
	postData[action_var] = 'recalculate';
	if (!!params && typeof params === 'object')
	{
		for (i in params)
		{
			if (params.hasOwnProperty(i))
				postData[i] = params[i];
		}
	}

	if (!!items && items.rows.length > 0)
	{
		for (i = 1; items.rows.length > i; i++)
			postData['QUANTITY_' + items.rows[i].id] = BX('QUANTITY_' + items.rows[i].id).value;
	}

	if (!!delayedItems && delayedItems.rows.length > 0)
	{
		for (i = 1; delayedItems.rows.length > i; i++)
			postData['DELAY_' + delayedItems.rows[i].id] = 'Y';
	}

	basketPoolQuantity.setProcessing(true);
	basketPoolQuantity.clearPool();

	BX.ajax({
        url: '/bitrix/components/bitrix/sale.basket.basket/ajax.php',
		method: 'POST',
		data: postData,
		dataType: 'json',
		onsuccess: function(result)
		{
			BX.closeWait();
			basketPoolQuantity.setProcessing(false);

			if(params.coupon)
			{
				//hello, gifts!
				if(!!result && !!result.BASKET_DATA && !!result.BASKET_DATA.NEED_TO_RELOAD_FOR_GETTING_GIFTS)
				{
					BX.reload();
				}
			}

			if (basketPoolQuantity.isPoolEmpty())
			{
				updateBasketTable(null, result);
				basketPoolQuantity.updateQuantity();
			}
			else
			{
				basketPoolQuantity.enableTimer(true);
			}
		}
	});
}

function showBasketItemsList(val)
{
	BX.removeClass(BX("basket_toolbar_button"), "current");
	BX.removeClass(BX("basket_toolbar_button_delayed"), "current");
	BX.removeClass(BX("basket_toolbar_button_subscribed"), "current");
	BX.removeClass(BX("basket_toolbar_button_not_available"), "current");

	BX("normal_count").style.display = 'inline-block';
	BX("delay_count").style.display = 'inline-block';
	BX("subscribe_count").style.display = 'inline-block';
	BX("not_available_count").style.display = 'inline-block';

	if (val == 2)
	{
		if (BX("basket_items_list"))
			BX("basket_items_list").style.display = 'none';
		if (BX("basket_items_delayed"))
		{
			BX("basket_items_delayed").style.display = 'block';
			BX.addClass(BX("basket_toolbar_button_delayed"), "current");
			BX("delay_count").style.display = 'none';
		}
		if (BX("basket_items_subscribed"))
			BX("basket_items_subscribed").style.display = 'none';
		if (BX("basket_items_not_available"))
			BX("basket_items_not_available").style.display = 'none';
	}
	else if(val == 3)
	{
		if (BX("basket_items_list"))
			BX("basket_items_list").style.display = 'none';
		if (BX("basket_items_delayed"))
			BX("basket_items_delayed").style.display = 'none';
		if (BX("basket_items_subscribed"))
		{
			BX("basket_items_subscribed").style.display = 'block';
			BX.addClass(BX("basket_toolbar_button_subscribed"), "current");
			BX("subscribe_count").style.display = 'none';
		}
		if (BX("basket_items_not_available"))
			BX("basket_items_not_available").style.display = 'none';
	}
	else if (val == 4)
	{
		if (BX("basket_items_list"))
			BX("basket_items_list").style.display = 'none';
		if (BX("basket_items_delayed"))
			BX("basket_items_delayed").style.display = 'none';
		if (BX("basket_items_subscribed"))
			BX("basket_items_subscribed").style.display = 'none';
		if (BX("basket_items_not_available"))
		{
			BX("basket_items_not_available").style.display = 'block';
			BX.addClass(BX("basket_toolbar_button_not_available"), "current");
			BX("not_available_count").style.display = 'none';
		}
	}
	else
	{
		if (BX("basket_items_list"))
		{
			BX("basket_items_list").style.display = 'block';
			BX.addClass(BX("basket_toolbar_button"), "current");
			BX("normal_count").style.display = 'none';
		}
		if (BX("basket_items_delayed"))
			BX("basket_items_delayed").style.display = 'none';
		if (BX("basket_items_subscribed"))
			BX("basket_items_subscribed").style.display = 'none';
		if (BX("basket_items_not_available"))
			BX("basket_items_not_available").style.display = 'none';
	}
}

function deleteCoupon()
{
	var target = this,
		value;

	if (BX.type.isElementNode(target) && target.hasAttribute('data-coupon'))
	{
		value = target.getAttribute('data-coupon');
		if (BX.type.isNotEmptyString(value))
		{
			recalcBasketAjax({'delete_coupon' : value});
		}
	}
}

function deleteProductRow(target)
{
	var targetRow = BX.findParent(target, {tagName: 'TR'}),
		quantityNode,
		delItem;

	if (targetRow)
	{
		quantityNode = BX('QUANTITY_' + targetRow.id);
		if (quantityNode)
		{
			delItem = getCurrentItemAnalyticsInfo(targetRow, quantityNode.value);
		}
	}

	setAnalyticsDataLayer([], [delItem]);

	document.location.href = target.href;

	return false;
}

function checkAnalytics(currentQuantity, newItems)
{
	if (!currentQuantity || !newItems || BX.util.array_values(currentQuantity).length === 0)
		return;

	var itemId, diff,
		current = {}, addItems = [], delItems = [],
		i;

	if (!!newItems && newItems.rows.length)
	{
		for (i = 1; newItems.rows.length > i; i++)
		{
			itemId = newItems.rows[i].id;
			diff = BX('QUANTITY_' + itemId).value - currentQuantity[itemId];

			if (diff != 0)
			{
				current = getCurrentItemAnalyticsInfo(newItems.rows[i], diff);

				if (diff > 0)
				{
					addItems.push(current);
				}
				else
				{
					delItems.push(current);
				}
			}
		}
	}

	if (addItems.length || delItems.length)
	{
		setAnalyticsDataLayer(addItems, delItems);
	}
}

function getCurrentItemAnalyticsInfo(row, diff)
{
	if (!row)
		return;

	var temp, k, variants = [];

	var current = {
		'name': row.getAttribute('data-item-name') || '',
		'id': row.id,
		'price': row.getAttribute('data-item-price') || 0,
		'brand': (row.getAttribute('data-item-brand') || '').split(',  ').join('/'),
		'variant': '',
		'quantity': Math.abs(diff)
	};

	temp = row.querySelectorAll('.bx_active[data-sku-name]');
	for (k = 0; k < temp.length; k++)
	{
		variants.push(temp[k].getAttribute('data-sku-name'));
	}

	current.variant = variants.join('/');

	return current;
}

function setAnalyticsDataLayer(addItems, delItems)
{
	window[basketJSParams['DATA_LAYER_NAME']] = window[basketJSParams['DATA_LAYER_NAME']] || [];

	if (addItems && addItems.length)
	{
		window[basketJSParams['DATA_LAYER_NAME']].push({
			'event': 'addToCart',
			'ecommerce': {
				'currencyCode': getCurrencyCode(),
				'add': {
					'products': addItems
				}
			}
		});
	}

	if (delItems && delItems.length)
	{
		window[basketJSParams['DATA_LAYER_NAME']].push({
			'event': 'removeFromCart',
			'ecommerce': {
				'currencyCode': getCurrencyCode(),
				'remove': {
					'products': delItems
				}
			}
		});
	}
}

function getCurrencyCode()
{
	var root = BX('basket_items'),
		node,
		currency = '';

	if (root)
	{
		node = root.querySelector('[data-item-currency');
		node && (currency = node.getAttribute('data-item-currency'));
	}

	return currency;


}

BX.ready(function() {

	basketPoolQuantity = new BasketPoolQuantity();
	var couponBlock = BX('coupons_block'),
		basketItems = BX('basket_items');

	if (BX.type.isElementNode(couponBlock))
		BX.bindDelegate(couponBlock, 'click', { 'attribute': 'data-coupon' }, deleteCoupon);

	if (BX.type.isElementNode(basketItems))
		BX.bindDelegate(basketItems, 'click', {tagName: 'li', 'attr': { 'data-sku-selector': 'Y' }}, skuPropClickHandler);

	if (BX.type.isNotEmptyString(basketJSParams['EVENT_ONCHANGE_ON_START']) && basketJSParams['EVENT_ONCHANGE_ON_START'] == "Y")
		BX.onCustomEvent('OnBasketChange');
});
/* End */
;
; /* Start:"a:4:{s:4:"full";s:98:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/mustache.js?154204184919670";s:6:"source";s:82:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/mustache.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 *
 * Copyright (c) 2009 Chris Wanstrath (Ruby)
 * Copyright (c) 2010-2014 Jan Lehnardt (JavaScript)
 * Copyright (c) 2010-2015 The mustache.js community
 *
 * Licensed under MIT (https://github.com/janl/mustache.js/blob/master/LICENSE)
 */

/*global define: false Mustache: true*/

(function defineMustache (global, factory) {
  if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
    factory(exports); // CommonJS
  } else if (typeof define === 'function' && define.amd) {
    define(['exports'], factory); // AMD
  } else {
    global.Mustache = {};
    factory(global.Mustache); // script, wsh, asp
  }
}(this, function mustacheFactory (mustache) {

  var objectToString = Object.prototype.toString;
  var isArray = Array.isArray || function isArrayPolyfill (object) {
    return objectToString.call(object) === '[object Array]';
  };

  function isFunction (object) {
    return typeof object === 'function';
  }

  /**
   * More correct typeof string handling array
   * which normally returns typeof 'object'
   */
  function typeStr (obj) {
    return isArray(obj) ? 'array' : typeof obj;
  }

  function escapeRegExp (string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
  }

  /**
   * Null safe way of checking whether or not an object,
   * including its prototype, has a given property
   */
  function hasProperty (obj, propName) {
    return obj != null && typeof obj === 'object' && (propName in obj);
  }

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var regExpTest = RegExp.prototype.test;
  function testRegExp (re, string) {
    return regExpTest.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace (string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  function escapeHtml (string) {
    return String(string).replace(/[&<>"'`=\/]/g, function fromEntityMap (s) {
      return entityMap[s];
    });
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate (template, tags) {
    if (!template)
      return [];

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace () {
      if (hasTag && !nonSpace) {
        while (spaces.length)
          delete tokens[spaces.pop()];
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var openingTagRe, closingTagRe, closingCurlyRe;
    function compileTags (tagsToCompile) {
      if (typeof tagsToCompile === 'string')
        tagsToCompile = tagsToCompile.split(spaceRe, 2);

      if (!isArray(tagsToCompile) || tagsToCompile.length !== 2)
        throw new Error('Invalid tags: ' + tagsToCompile);

      openingTagRe = new RegExp(escapeRegExp(tagsToCompile[0]) + '\\s*');
      closingTagRe = new RegExp('\\s*' + escapeRegExp(tagsToCompile[1]));
      closingCurlyRe = new RegExp('\\s*' + escapeRegExp('}' + tagsToCompile[1]));
    }

    compileTags(tags || mustache.tags);

    var scanner = new Scanner(template);

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(openingTagRe);

      if (value) {
        for (var i = 0, valueLength = value.length; i < valueLength; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push([ 'text', chr, start, start + 1 ]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n')
            stripSpace();
        }
      }

      // Match the opening tag.
      if (!scanner.scan(openingTagRe))
        break;

      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(closingTagRe);
      } else if (type === '{') {
        value = scanner.scanUntil(closingCurlyRe);
        scanner.scan(curlyRe);
        scanner.scanUntil(closingTagRe);
        type = '&';
      } else {
        value = scanner.scanUntil(closingTagRe);
      }

      // Match the closing tag.
      if (!scanner.scan(closingTagRe))
        throw new Error('Unclosed tag at ' + scanner.pos);

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection)
          throw new Error('Unopened section "' + value + '" at ' + start);

        if (openSection[1] !== value)
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        compileTags(value);
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();

    if (openSection)
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens (tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens (tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      token = tokens[i];

      switch (token[0]) {
        case '#':
        case '^':
          collector.push(token);
          sections.push(token);
          collector = token[4] = [];
          break;
        case '/':
          section = sections.pop();
          section[5] = token[2];
          collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
          break;
        default:
          collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner (string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function eos () {
    return this.tail === '';
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function scan (re) {
    var match = this.tail.match(re);

    if (!match || match.index !== 0)
      return '';

    var string = match[0];

    this.tail = this.tail.substring(string.length);
    this.pos += string.length;

    return string;
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function scanUntil (re) {
    var index = this.tail.search(re), match;

    switch (index) {
      case -1:
        match = this.tail;
        this.tail = '';
        break;
      case 0:
        match = '';
        break;
      default:
        match = this.tail.substring(0, index);
        this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context (view, parentContext) {
    this.view = view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function push (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function lookup (name) {
    var cache = this.cache;

    var value;
    if (cache.hasOwnProperty(name)) {
      value = cache[name];
    } else {
      var context = this, names, index, lookupHit = false;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;
          names = name.split('.');
          index = 0;

          /**
           * Using the dot notion path in `name`, we descend through the
           * nested objects.
           *
           * To be certain that the lookup has been successful, we have to
           * check if the last object in the path actually has the property
           * we are looking for. We store the result in `lookupHit`.
           *
           * This is specially necessary for when the value has been set to
           * `undefined` and we want to avoid looking up parent contexts.
           **/
          while (value != null && index < names.length) {
            if (index === names.length - 1)
              lookupHit = hasProperty(value, names[index]);

            value = value[names[index++]];
          }
        } else {
          value = context.view[name];
          lookupHit = hasProperty(context.view, name);
        }

        if (lookupHit)
          break;

        context = context.parent;
      }

      cache[name] = value;
    }

    if (isFunction(value))
      value = value.call(this.view);

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer () {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function clearCache () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function parse (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null)
      tokens = cache[template + ':' + (tags || mustache.tags).join(':')] = parseTemplate(template, tags);

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function render (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function renderTokens (tokens, context, partials, originalTemplate) {
    var buffer = '';

    var token, symbol, value;
    for (var i = 0, numTokens = tokens.length; i < numTokens; ++i) {
      value = undefined;
      token = tokens[i];
      symbol = token[0];

      if (symbol === '#') value = this.renderSection(token, context, partials, originalTemplate);
      else if (symbol === '^') value = this.renderInverted(token, context, partials, originalTemplate);
      else if (symbol === '>') value = this.renderPartial(token, context, partials, originalTemplate);
      else if (symbol === '&') value = this.unescapedValue(token, context);
      else if (symbol === 'name') value = this.escapedValue(token, context);
      else if (symbol === 'text') value = this.rawValue(token);

      if (value !== undefined)
        buffer += value;
    }

    return buffer;
  };

  Writer.prototype.renderSection = function renderSection (token, context, partials, originalTemplate) {
    var self = this;
    var buffer = '';
    var value = context.lookup(token[1]);

    // This function is used to render an arbitrary template
    // in the current context by higher-order sections.
    function subRender (template) {
      return self.render(template, context, partials);
    }

    if (!value) return;

    if (isArray(value)) {
      for (var j = 0, valueLength = value.length; j < valueLength; ++j) {
        buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
      }
    } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
      buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
    } else if (isFunction(value)) {
      if (typeof originalTemplate !== 'string')
        throw new Error('Cannot use higher-order sections without the original template');

      // Extract the portion of the original template that the section contains.
      value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

      if (value != null)
        buffer += value;
    } else {
      buffer += this.renderTokens(token[4], context, partials, originalTemplate);
    }
    return buffer;
  };

  Writer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
    var value = context.lookup(token[1]);

    // Use JavaScript's definition of falsy. Include empty arrays.
    // See https://github.com/janl/mustache.js/issues/186
    if (!value || (isArray(value) && value.length === 0))
      return this.renderTokens(token[4], context, partials, originalTemplate);
  };

  Writer.prototype.renderPartial = function renderPartial (token, context, partials) {
    if (!partials) return;

    var value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
    if (value != null)
      return this.renderTokens(this.parse(value), context, partials, value);
  };

  Writer.prototype.unescapedValue = function unescapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return value;
  };

  Writer.prototype.escapedValue = function escapedValue (token, context) {
    var value = context.lookup(token[1]);
    if (value != null)
      return mustache.escape(value);
  };

  Writer.prototype.rawValue = function rawValue (token) {
    return token[1];
  };

  mustache.name = 'mustache.js';
  mustache.version = '2.3.0';
  mustache.tags = [ '{{', '}}' ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function clearCache () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function parse (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function render (template, view, partials) {
    if (typeof template !== 'string') {
      throw new TypeError('Invalid template! Template should be a "string" ' +
                          'but "' + typeStr(template) + '" was given as the first ' +
                          'argument for mustache#render(template, view, partials)');
    }

    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.,
  /*eslint-disable */ // eslint wants camel cased function name
  mustache.to_html = function to_html (template, view, partials, send) {
    /*eslint-enable*/

    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

  return mustache;
}));

/* End */
;
; /* Start:"a:4:{s:4:"full";s:100:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/action-pool.js?15420418495918";s:6:"source";s:85:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/action-pool.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function(){
	'use strict';

	BX.namespace('BX.Sale.BasketActionPool');

	BX.Sale.BasketActionPool = function(component)
	{
		this.component = component;

		this.requestProcessing = false;
		this.updateTimer = null;

		this.isBasketRefreshed = this.component.params.DEFERRED_REFRESH !== 'Y';
		this.needFullRecalculation = this.component.params.DEFERRED_REFRESH === 'Y';

		this.pool = {};
		this.lastActualPool = {};

		this.approvedAction = ['QUANTITY', 'DELETE', 'RESTORE', 'DELAY', 'OFFER', 'MERGE_OFFER'];

		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.setRefreshStatus = function(status)
	{
		this.isBasketRefreshed = !!status;
	};

	BX.Sale.BasketActionPool.prototype.getRefreshStatus = function()
	{
		return this.isBasketRefreshed;
	};

	BX.Sale.BasketActionPool.prototype.isItemInPool = function(itemId)
	{
		return !!this.pool[itemId];
	};

	BX.Sale.BasketActionPool.prototype.clearLastActualQuantityPool = function(itemId)
	{
		this.lastActualPool[itemId] && delete this.lastActualPool[itemId].QUANTITY;
	};

	BX.Sale.BasketActionPool.prototype.checkItemPoolBefore = function(itemId)
	{
		if (!itemId)
			return;

		this.pool[itemId] = this.pool[itemId] || {};
	};

	BX.Sale.BasketActionPool.prototype.checkItemPoolAfter = function(itemId)
	{
		if (!itemId || !this.pool[itemId])
			return;

		if (Object.keys(this.pool[itemId]).length === 0)
		{
			delete this.pool[itemId];
		}
	};

	BX.Sale.BasketActionPool.prototype.addCoupon = function(coupon)
	{
		this.pool.COUPON = coupon;

		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.removeCoupon = function(coupon)
	{
		this.checkItemPoolBefore('REMOVE_COUPON');

		this.pool.REMOVE_COUPON[coupon] = coupon;

		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.changeQuantity = function(itemId, quantity, oldQuantity)
	{
		this.checkItemPoolBefore(itemId);

		if (
			(this.lastActualPool[itemId] && this.lastActualPool[itemId].QUANTITY !== quantity)
			|| (!this.lastActualPool[itemId] && quantity !== oldQuantity)
		)
		{
			this.pool[itemId].QUANTITY = quantity;
		}
		else
		{
			this.pool[itemId] && delete this.pool[itemId].QUANTITY;
		}

		this.checkItemPoolAfter(itemId);
		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.deleteItem = function(itemId)
	{
		this.checkItemPoolBefore(itemId);

		if (this.pool[itemId].RESTORE)
		{
			delete this.pool[itemId].RESTORE;
		}
		else
		{
			this.pool[itemId].DELETE = 'Y';
		}

		this.checkItemPoolAfter(itemId);
		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.restoreItem = function(itemId, itemData)
	{
		this.checkItemPoolBefore(itemId);

		if (this.pool[itemId].DELETE === 'Y')
		{
			delete this.pool[itemId].DELETE;
		}
		else
		{
			this.pool[itemId].RESTORE = itemData;
		}

		this.checkItemPoolAfter(itemId);
		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.addDelayed = function(itemId)
	{
		this.checkItemPoolBefore(itemId);

		this.pool[itemId].DELAY = 'Y';

		this.checkItemPoolAfter(itemId);
		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.removeDelayed = function(itemId)
	{
		this.checkItemPoolBefore(itemId);

		this.pool[itemId].DELAY = 'N';

		this.checkItemPoolAfter(itemId);
		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.changeSku = function(itemId, props, oldProps)
	{
		if (JSON.stringify(props) !== JSON.stringify(oldProps))
		{
			this.checkItemPoolBefore(itemId);
			this.pool[itemId].OFFER = props;
		}
		else
		{
			this.pool[itemId] && delete this.pool[itemId].OFFER;
			this.checkItemPoolAfter(itemId);
		}

		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.mergeSku = function(itemId)
	{
		this.checkItemPoolBefore(itemId);
		this.pool[itemId].MERGE_OFFER = 'Y';

		this.switchTimer();
	};

	BX.Sale.BasketActionPool.prototype.switchTimer = function()
	{
		clearTimeout(this.updateTimer);

		if (this.isProcessing())
		{
			return;
		}

		if (this.isPoolEmpty())
		{
			this.component.editPostponedBasketItems();
			this.component.fireCustomEvents();
		}

		if (!this.isPoolEmpty())
		{
			this.updateTimer = setTimeout(BX.proxy(this.trySendPool, this), 300);
		}
		else if (!this.getRefreshStatus())
		{
			this.trySendPool();
		}
	};

	BX.Sale.BasketActionPool.prototype.trySendPool = function()
	{
		if (this.isPoolEmpty() && this.getRefreshStatus())
		{
			return;
		}

		this.doProcessing(true);

		if (!this.isPoolEmpty())
		{
			this.component.sendRequest('recalculateAjax', {
				basket: this.getPoolData()
			});

			this.lastActualPool = this.pool;
			this.pool = {};
		}
		else if (!this.getRefreshStatus())
		{
			this.component.sendRequest('refreshAjax', {
				fullRecalculation: this.needFullRecalculation ? 'Y' : 'N'
			});
			this.needFullRecalculation = false;
		}
	};

	BX.Sale.BasketActionPool.prototype.getPoolData = function()
	{
		var poolData = {},
			currentPool = this.pool;

		if (currentPool.COUPON)
		{
			poolData.coupon = currentPool.COUPON;
			delete currentPool.COUPON;
		}

		if (currentPool.REMOVE_COUPON)
		{
			poolData.delete_coupon = currentPool.REMOVE_COUPON;
			delete currentPool.REMOVE_COUPON;
		}

		for (var id in currentPool)
		{
			if (currentPool.hasOwnProperty(id))
			{
				for (var action in currentPool[id])
				{
					if (currentPool[id].hasOwnProperty(action) && BX.util.in_array(action, this.approvedAction))
					{
						poolData[action + '_' + id] = currentPool[id][action];
					}
				}
			}
		}

		return poolData;
	};

	BX.Sale.BasketActionPool.prototype.isPoolEmpty = function()
	{
		return Object.keys(this.pool).length === 0;
	};

	BX.Sale.BasketActionPool.prototype.doProcessing = function(state)
	{
		this.requestProcessing = state === true;

		if (this.requestProcessing)
		{
			this.component.startLoader();
		}
		else
		{
			this.component.endLoader();
		}
	};

	BX.Sale.BasketActionPool.prototype.isProcessing = function()
	{
		return this.requestProcessing === true;
	};
})();
/* End */
;
; /* Start:"a:4:{s:4:"full";s:96:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/filter.js?154204184913835";s:6:"source";s:80:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/filter.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function(){
	'use strict';

	BX.namespace('BX.Sale.BasketFilter');

	BX.Sale.BasketFilter = function(component)
	{
		this.component = component;

		this.activeFilterMode = false;
		this.filterTimer = null;
		this.mouseOverClearFilter = false;

		this.realShownItems = [];
		this.realSortedItems = [];
		this.realScrollTop = 0;

		this.lastShownItemsHash = '';
		this.currentFilter = {
			query: '',
			similarHash: '',
			warning: false,
			notAvailable: false,
			delayed: false
		};

		if (this.component.useItemsFilter)
		{
			this.bindEvents();
		}
	};

	BX.Sale.BasketFilter.prototype.bindEvents = function()
	{
		var entity;
		var filterNode = this.component.getEntity(
			this.component.getCacheNode(this.component.ids.itemListWrapper),
			'basket-filter'
		);

		entity = this.component.getEntity(filterNode, 'basket-filter-input');
		if (BX.type.isDomNode(entity))
		{
			BX.bind(entity, 'focus', function() {
				filterNode.style.flex = 3;
			});
			BX.bind(entity, 'blur', BX.delegate(function() {
				if (!this.mouseOverClearFilter)
				{
					filterNode.style.flex = '';
				}
			}, this));

			BX.bind(entity, 'keyup', BX.proxy(this.onFilterInput, this));
			BX.bind(entity, 'cut', BX.proxy(this.onFilterInput, this));
			BX.bind(entity, 'paste', BX.proxy(this.onFilterInput, this));
		}

		entity = this.component.getEntity(filterNode, 'basket-filter-clear-btn');
		if (BX.type.isDomNode(entity))
		{
			BX.bind(entity, 'mouseenter', BX.delegate(function() {
				this.mouseOverClearFilter = true;
			}, this));
			BX.bind(entity, 'mouseout', BX.delegate(function() {
				this.mouseOverClearFilter = false;
			}, this));
			BX.bind(entity, 'click', BX.delegate(function() {
				if (!this.filterInputEmpty())
				{
					this.clearFilterInput();
					this.onFilterChange();
				}

				filterNode.style.flex = '';
			}, this));
		}
	};

	BX.Sale.BasketFilter.prototype.isActive = function()
	{
		return this.activeFilterMode;
	};

	BX.Sale.BasketFilter.prototype.showFilterByName = function(name)
	{
		if (!name)
			return;

		switch (name)
		{
			case 'not-available':
				this.showNotAvailableItemsFilter();
				break;
			case 'delayed':
				this.showDelayItemsFilter();
				break;
			case 'warning':
				this.showWarningItemsFilter();
				break;
			case 'similar':
				this.showSimilarItemsFilter();
				break;
			case 'all':
			default:
				this.clearAllFiltersExcept([]);
				this.onFilterChange();
		}
	};

	BX.Sale.BasketFilter.prototype.onFilterInput = function()
	{
		var value = BX.type.isDomNode(BX.proxy_context) ? BX.util.trim(BX.proxy_context.value).toLowerCase() : '';

		if (this.currentFilter.query !== value)
		{
			this.currentFilter.query = value;

			this.onFilterChange();
		}
	};

	BX.Sale.BasketFilter.prototype.clearAllFiltersExcept = function(names)
	{
		if (!names || !BX.type.isArray(names))
			return;

		!BX.util.in_array('input', names) && this.clearFilterInput();
		!BX.util.in_array('warning', names) && this.clearWarningItemsFilter();
		!BX.util.in_array('delayed', names) && this.clearDelayItemsFilter();
		!BX.util.in_array('not-available', names) && this.clearNotAvailableItemsFilter();

		if (!BX.util.in_array('similar', names))
		{
			this.clearSimilarItemsFilter();
			this.component.showSimilarCount(false);
		}
	};

	BX.Sale.BasketFilter.prototype.filterInputEmpty = function()
	{
		return this.currentFilter.query.length === 0;
	};

	BX.Sale.BasketFilter.prototype.clearFilterInput = function()
	{
		this.currentFilter.query = '';

		var input = this.component.getEntity(
			this.component.getCacheNode(this.component.ids.itemListWrapper),
			'basket-filter-input'
		);
		if (BX.type.isDomNode(input))
		{
			input.value = '';
		}
	};

	BX.Sale.BasketFilter.prototype.addWarningItemsFilter = function()
	{
		this.currentFilter.warning = true;
	};

	BX.Sale.BasketFilter.prototype.clearWarningItemsFilter = function()
	{
		this.currentFilter.warning = false;
	};

	BX.Sale.BasketFilter.prototype.showWarningItemsFilter = function()
	{
		if (!this.currentFilter.warning)
		{
			this.clearAllFiltersExcept(['warning']);
			this.addWarningItemsFilter();
			this.onFilterChange();
		}
	};

	BX.Sale.BasketFilter.prototype.addDelayItemsFilter = function()
	{
		this.currentFilter.delayed = true;
	};

	BX.Sale.BasketFilter.prototype.clearDelayItemsFilter = function()
	{
		this.currentFilter.delayed = false;
	};

	BX.Sale.BasketFilter.prototype.showDelayItemsFilter = function()
	{
		if (!this.currentFilter.delayed)
		{
			this.clearAllFiltersExcept(['delayed']);
			this.addDelayItemsFilter();
			this.onFilterChange();
		}
	};

	BX.Sale.BasketFilter.prototype.addNotAvailableItemsFilter = function()
	{
		this.currentFilter.notAvailable = true;
	};

	BX.Sale.BasketFilter.prototype.clearNotAvailableItemsFilter = function()
	{
		this.currentFilter.notAvailable = false;
	};

	BX.Sale.BasketFilter.prototype.showNotAvailableItemsFilter = function()
	{
		if (!this.currentFilter.notAvailable)
		{
			this.clearAllFiltersExcept(['not-available']);
			this.addNotAvailableItemsFilter();
			this.onFilterChange();
		}
	};

	BX.Sale.BasketFilter.prototype.addSimilarItemsFilter = function(item)
	{
		this.currentFilter.similarHash = item.HASH;
	};

	BX.Sale.BasketFilter.prototype.clearSimilarItemsFilter = function()
	{
		this.currentFilter.similarHash = '';
	};

	BX.Sale.BasketFilter.prototype.showSimilarItemsFilter = function()
	{
		var item = this.component.getItemDataByTarget(BX.proxy_context);

		if (this.currentFilter.similarHash !== item.HASH)
		{
			this.clearAllFiltersExcept(['similar']);
			this.addSimilarItemsFilter(item);
			this.onFilterChange();
		}
	};

	BX.Sale.BasketFilter.prototype.getTimeoutDuration = function()
	{
		return this.component.duration.filterTimer;
	};

	BX.Sale.BasketFilter.prototype.onFilterChange = function()
	{
		this.component.showItemsOverlay();

		if (
			this.currentFilter.query.length
			|| this.currentFilter.similarHash.length
			|| this.currentFilter.warning
			|| this.currentFilter.notAvailable
			|| this.currentFilter.delayed
		)
		{
			clearTimeout(this.filterTimer);
			this.filterTimer = setTimeout(BX.proxy(this.enableFilterMode, this), this.getTimeoutDuration());
		}
		else
		{
			this.disableFilterMode();
		}
	};

	BX.Sale.BasketFilter.prototype.enableFilterMode = function()
	{
		var foundItemsHash;

		if (!this.activeFilterMode)
		{
			this.activeFilterMode = true;
			this.realShownItems = BX.util.array_values(this.component.shownItems);
			this.realSortedItems = BX.util.array_values(this.component.sortedItems);
			this.realScrollTop = this.component.getDocumentScrollTop();
		}

		this.component.scrollToFirstItem();

		this.component.sortedItems = this.searchItems();

		foundItemsHash = JSON.stringify(this.component.sortedItems);

		if (this.lastShownItemsHash !== foundItemsHash)
		{
			this.lastShownItemsHash = foundItemsHash;

			this.component.deleteBasketItems(BX.util.array_values(this.component.shownItems), false);

			if (this.component.sortedItems.length)
			{
				this.component.initializeBasketItems();
				this.hideEmptyFilterResult();
			}
			else
			{
				this.showEmptyFilterResult();
			}

			if (this.currentFilter.similarHash.length)
			{
				this.component.showSimilarCount(true);
			}
		}
		else
		{
			this.highlightFoundItems();
		}

		this.component.hideItemsOverlay();
	};

	BX.Sale.BasketFilter.prototype.disableFilterMode = function()
	{
		clearTimeout(this.filterTimer);
		this.lastShownItemsHash = '';

		if (this.activeFilterMode)
		{
			this.activeFilterMode = false;
			this.component.sortedItems = BX.util.array_values(this.realSortedItems);

			this.component.deleteBasketItems(BX.util.array_values(this.component.shownItems), false);
			this.hideEmptyFilterResult();

			this.component.editBasketItems(BX.util.array_values(this.realShownItems));
			window.scrollTo(0, this.realScrollTop);
		}

		this.component.hideItemsOverlay();
	};

	BX.Sale.BasketFilter.prototype.searchItems = function()
	{
		var items = [];

		for (var i = 0; i < this.realSortedItems.length; i++)
		{
			var item = this.component.items[this.realSortedItems[i]];

			if (item && this.searchItemMatch(item))
			{
				items.push(item.ID);
			}
		}

		return items;
	};

	BX.Sale.BasketFilter.prototype.highlightFoundItems = function()
	{
		if (!this.activeFilterMode)
			return;

		for (var i in this.component.shownItems)
		{
			if (this.component.shownItems.hasOwnProperty(i))
			{
				this.highlightSearchMatch(this.component.items[this.component.shownItems[i]]);
			}
		}
	};

	BX.Sale.BasketFilter.prototype.searchItemMatch = function(item)
	{
		var match = false,
			found = false;

		if (this.currentFilter.notAvailable)
		{
			found = !!item.NOT_AVAILABLE;
			if (!found)
			{
				return match;
			}
		}
		else if (this.currentFilter.delayed)
		{
			found = !!item.DELAYED;
			if (!found)
			{
				return match;
			}
		}
		else if (this.currentFilter.warning)
		{
			found = BX.util.in_array(item.ID, this.component.warningItems);
			if (!found)
			{
				return match;
			}
		}
		else if (BX.type.isNotEmptyString(this.currentFilter.similarHash))
		{
			found = this.currentFilter.similarHash === item.HASH;
			if (!found)
			{
				return match;
			}
		}

		if (BX.type.isNotEmptyString(this.currentFilter.query))
		{
			if (item.NAME.toLowerCase().indexOf(this.currentFilter.query) !== -1)
			{
				match = 'NAME';
			}

			if (!match)
			{
				var floatValue = parseFloat(this.currentFilter.query);
				if (!isNaN(floatValue))
				{
					if (parseFloat(item.PRICE) === floatValue)
					{
						match = 'PRICE';
					}
					else if (parseFloat(item.SUM_PRICE) === floatValue)
					{
						match = 'SUM_PRICE';
					}
				}
			}

			if (!match && this.currentFilter.query.length >= 3)
			{
				if (item.PRICE_FORMATED.toLowerCase().indexOf(this.currentFilter.query) !== -1)
				{
					match = 'PRICE';
				}
				else if (item.SUM_PRICE_FORMATED.toLowerCase().indexOf(this.currentFilter.query) !== -1)
				{
					match = 'SUM_PRICE';
				}
			}

			var k, lcValue;

			if (!match && item.PROPS.length)
			{
				for (k in item.PROPS)
				{
					if (item.PROPS.hasOwnProperty(k) && BX.type.isNotEmptyString(item.PROPS[k].VALUE))
					{
						lcValue = item.PROPS[k].VALUE.toLowerCase();

						if (
							lcValue === this.currentFilter.query
							|| (this.currentFilter.query.length >= 3 && lcValue.indexOf(this.currentFilter.query) !== -1)
						)
						{
							match = 'PROPS';
							break;
						}
					}
				}
			}

			if (!match && item.COLUMN_LIST.length)
			{
				for (k in item.COLUMN_LIST)
				{
					if (item.COLUMN_LIST.hasOwnProperty(k) && BX.type.isNotEmptyString(item.COLUMN_LIST[k].VALUE))
					{
						lcValue = item.COLUMN_LIST[k].VALUE.toLowerCase();

						if (
							lcValue === this.currentFilter.query
							|| (this.currentFilter.query.length >= 3 && lcValue.indexOf(this.currentFilter.query) !== -1)
						)
						{
							match = 'COLUMNS';
							break;
						}
					}
				}
			}
		}
		else if (found)
		{
			match = true;
		}

		return match;
	};

	BX.Sale.BasketFilter.prototype.highlightSearchMatch = function(itemData)
	{
		var searchMatch = this.searchItemMatch(itemData);

		if (searchMatch)
		{
			var entity, i, k, code;

			switch (searchMatch)
			{
				case 'NAME':
					entity = this.component.getEntity(BX(this.component.ids.item + itemData.ID), 'basket-item-name');
					if (BX.type.isDomNode(entity))
					{
						entity.innerHTML = itemData.NAME.replace(
							new RegExp('(' + this.currentFilter.query + ')', 'gi'),
							'<span class="basket-item-highlighted">$1</span>'
						);
					}
					break;
				case 'PRICE':
					entity = BX(this.component.ids.price + itemData.ID);
					BX.addClass(entity, 'basket-item-highlighted');
					break;
				case 'SUM_PRICE':
					entity = BX(this.component.ids.sumPrice + itemData.ID);
					BX.addClass(entity, 'basket-item-highlighted');
					break;
				case 'PROPS':
					entity = this.component.getEntities(BX(this.component.ids.item + itemData.ID), 'basket-item-property-value');

					for (i = 0; i < entity.length; i++)
					{
						code = entity[i].getAttribute('data-property-code');

						for (k in itemData.PROPS)
						{
							if (itemData.PROPS.hasOwnProperty(k) && itemData.PROPS[k].CODE === code)
							{
								entity[i].innerHTML = itemData.PROPS[k].VALUE.replace(
									new RegExp('(' + this.currentFilter.query + ')', 'gi'),
									'<span class="basket-item-highlighted">$1</span>'
								);
							}
						}
					}
					break;
				case 'COLUMNS':
					entity = this.component.getEntities(BX(this.component.ids.item + itemData.ID), 'basket-item-property-column-value');

					for (i = 0; i < entity.length; i++)
					{
						code = entity[i].getAttribute('data-column-property-code');

						for (k in itemData.COLUMN_LIST)
						{
							if (itemData.COLUMN_LIST.hasOwnProperty(k) && itemData.COLUMN_LIST[k].CODE === code)
							{
								entity[i].innerHTML = itemData.COLUMN_LIST[k].VALUE.replace(
									new RegExp('(' + this.currentFilter.query + ')', 'gi'),
									'<span class="basket-item-highlighted">$1</span>'
								);
							}
						}
					}
					break;
			}
		}
	};

	BX.Sale.BasketFilter.prototype.showEmptyFilterResult = function()
	{
		var itemListNode = this.component.getCacheNode(this.component.ids.itemList);

		if (BX.type.isDomNode(itemListNode) && itemListNode.clientHeight >= 500)
		{
			var emptyResultNode = this.component.getCacheNode(this.component.ids.itemListEmptyResult);

			if (BX.type.isDomNode(emptyResultNode))
			{
				emptyResultNode.style.display = '';
			}
		}
	};

	BX.Sale.BasketFilter.prototype.hideEmptyFilterResult = function()
	{
		var emptyResultNode = this.component.getCacheNode(this.component.ids.itemListEmptyResult);

		if (BX.type.isDomNode(emptyResultNode))
		{
			emptyResultNode.style.display = 'none';
		}
	};
})();
/* End */
;
; /* Start:"a:4:{s:4:"full";s:99:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/component.js?154816734663921";s:6:"source";s:83:"/local/templates/shop/components/bitrix/sale.basket.basket/.default/js/component.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
;(function() {
	'use strict';
	BX.namespace('BX.Sale.BasketComponent');

	BX.Sale.BasketComponent = {
		isMobile: BX.browser.IsMobile(),
		isTouch: BX.hasClass(document.documentElement, 'bx-touch'),
		lastAction: 'initialLoad',
		maxItemsShowCount: 30,

		precisionFactor: Math.pow(10, 6),

		quantityDelay: null,
		quantityTimer: null,

		stickyHeaderOffset: 0,

		duration: {
			priceAnimation: 300,
			filterTimer: 300
		},

		imagePopup: null,
		loadingScreen: null,

		templates: {},
		nodes: {},

		/** Object of all basket items (itemId => itemArray) */
		items: {},

		/** Array of all basket items to show sorted by field SORT */
		sortedItems: [],

		/** Array of basket items showed on screen */
		shownItems: [],

		/** Array of basket items changed since last request */
		changedItems: [],

		/** Array of basket items postponed by pool to edit */
		postponedItems: [],

		/** Array of basket items with warnings */
		warningItems: [],

		ids: {
			item: 'basket-item-',
			quantity: 'basket-item-quantity-',
			price: 'basket-item-price-',
			sumPrice: 'basket-item-sum-price-',
			sumPriceOld: 'basket-item-sum-price-old-',
			sumPriceDiff: 'basket-item-sum-price-difference-',
			itemHeightAligner: 'basket-item-height-aligner-',
			total: 'basket-total-price',
			basketRoot: 'basket-root',
			itemListWrapper: 'basket-items-list-wrapper',
			itemListContainer: 'basket-items-list-container',
			itemList: 'basket-item-list',
			itemListTable: 'basket-item-table',
			itemListEmptyResult: 'basket-item-list-empty-result',
			itemListOverlay: 'basket-items-list-overlay',
			warning: 'basket-warning'
		},

		init: function(parameters)
		{
			this.params = parameters.params || {};
			this.template = parameters.template || '';
			this.signedParamsString = parameters.signedParamsString || '';
			this.siteId = parameters.siteId || '';
			this.ajaxUrl = parameters.ajaxUrl || '';
			this.templateFolder = parameters.templateFolder || '';

			this.useDynamicScroll = this.params.USE_DYNAMIC_SCROLL === 'Y';
			this.useItemsFilter = this.params.SHOW_FILTER === 'Y' && !this.isMobile;

			this.initializeFilter();
			this.applyBasketResult(parameters.result);
			this.initializeActionPool();

			if (this.useItemsFilter)
			{
				this.checkHeaderDisplay();
				this.bindHeaderEvents();
			}

			this.initializeBasketItems();
			this.editTotal();
			this.editWarnings();

			this.adjustBasketWrapperHeight();
			this.getCacheNode(this.ids.basketRoot).style.opacity = 1;

			this.bindInitialEvents();
		},

		getTemplate: function(templateName)
		{
			if (!this.templates.hasOwnProperty(templateName))
			{
				var template = BX(templateName);
				this.templates[templateName] = BX.type.isDomNode(template) ? template.innerHTML : '';
			}

			return this.templates[templateName];
		},

		getCacheNode: function(id)
		{
			if (!this.nodes.hasOwnProperty(id))
			{
				this.nodes[id] = BX(id);
			}

			return this.nodes[id];
		},

		getEntity: function(parent, entity, additionalFilter)
		{
			if (!parent || !entity)
				return null;

			additionalFilter = additionalFilter || '';

			return parent.querySelector(additionalFilter + '[data-entity="' + entity + '"]');
		},

		getEntities: function(parent, entity, additionalFilter)
		{
			if (!parent || !entity)
				return {length: 0};

			additionalFilter = additionalFilter || '';

			return parent.querySelectorAll(additionalFilter + '[data-entity="' + entity + '"]');
		},

		bindInitialEvents: function()
		{
			this.bindWarningEvents();

			BX.bind(window, 'scroll', BX.proxy(this.checkStickyHeaders, this));
			BX.bind(window, 'scroll', BX.proxy(this.lazyLoad, this));

			BX.bind(window, 'resize', BX.throttle(this.checkStickyHeaders, 20, this));
			BX.bind(window, 'resize', BX.throttle(this.adjustBasketWrapperHeight, 20, this));
		},

		bindWarningEvents: function()
		{
			var showItemsNode = this.getEntity(BX(this.ids.warning), 'basket-items-warning-count');

			if (BX.type.isDomNode(showItemsNode))
			{
				showItemsNode.style.display = '';
				BX.bind(showItemsNode, 'click', BX.delegate(function() {this.toggleFilter('warning');}, this));
			}

			BX.bind(
				this.getEntity(BX(this.ids.warning), 'basket-items-warning-notification-close'),
				'click',
				BX.proxy(this.removeAllWarnings, this)
			);
		},

		toggleFilter: function(event)
		{
			var target = BX.type.isNotEmptyString(event) ?
				this.getEntity(
					this.getCacheNode(this.ids.itemListWrapper),
					'basket-items-count',
					'[data-filter="' + event + '"]'
				)
				: BX.getEventTarget(event);

			if (!BX.type.isDomNode(target) || BX.hasClass(target, 'active'))
				return;

			var entityName = target.getAttribute('data-filter');
			var entities = target.parentNode.querySelectorAll('[data-filter]');

			for (var i = 0; i < entities.length; i++)
			{
				if (entities[i].getAttribute('data-filter') === entityName)
				{
					BX.addClass(entities[i], 'active');
				}
				else if (BX.hasClass(entities[i], 'active'))
				{
					BX.removeClass(entities[i], 'active');
				}
			}

			this.filter.showFilterByName(entityName);
		},

		scrollToFirstItem: function()
		{
			var headerNode = this.getEntity(this.getCacheNode(this.ids.itemListWrapper), 'basket-items-list-header');

			if (BX.type.isDomNode(headerNode))
			{
				var itemListTopPosition = BX.pos(this.getCacheNode(this.ids.itemListContainer)).top;
				var headerBottomPosition = BX.pos(headerNode).bottom;

				if (itemListTopPosition < headerBottomPosition)
				{
					window.scrollTo(0, itemListTopPosition - this.stickyHeaderOffset);
				}
			}
		},

		showItemsOverlay: function()
		{
			var overlay = this.getCacheNode(this.ids.itemListOverlay);

			if (BX.type.isDomNode(overlay))
			{
				overlay.style.display = '';
			}
		},

		hideItemsOverlay: function()
		{
			var overlay = this.getCacheNode(this.ids.itemListOverlay);

			if (BX.type.isDomNode(overlay))
			{
				overlay.style.display = 'none';
			}
		},

		checkHeaderDisplay: function()
		{
			var header = this.getCacheNode(this.ids.itemListWrapper);

			if (BX.type.isDomNode(header))
			{
				BX.removeClass(header, 'basket-items-list-wrapper-light');
			}
		},

		bindHeaderEvents: function()
		{
			var entities = this.getEntities(this.getCacheNode(this.ids.itemListWrapper), 'basket-items-count');

			for (var i = 0; i < entities.length; i++)
			{
				BX.bind(entities[i], 'click', BX.proxy(this.toggleFilter, this));
			}
		},

		checkStickyHeaders: function()
		{
			if (this.isMobile)
				return;

			var node, position;
			var border = 2, offset = 0;
			var scrollTop = this.getDocumentScrollTop();
			var basketPosition = BX.pos(this.getCacheNode(this.ids.basketRoot));
			var basketScrolledToEnd = scrollTop + 200 >= basketPosition.bottom;

			if (BX.util.in_array('top', this.params.TOTAL_BLOCK_DISPLAY))
			{
				var totalBlockNode = this.getEntity(this.getCacheNode(this.ids.basketRoot), 'basket-total-block');
				if (BX.type.isDomNode(totalBlockNode))
				{
					node = this.getEntity(totalBlockNode, 'basket-checkout-aligner');
					if (BX.type.isDomNode(node))
					{
						position = BX.pos(totalBlockNode);

						if (scrollTop >= position.top)
						{
							offset += node.clientHeight;

							if (!BX.hasClass(node, 'basket-checkout-container-fixed'))
							{
								totalBlockNode.style.height = position.height + 'px';

								node.style.width = node.clientWidth + border + 'px';
								BX.addClass(node, 'basket-checkout-container-fixed');
							}
						}
						else if (BX.hasClass(node, 'basket-checkout-container-fixed'))
						{
							totalBlockNode.style.height = '';

							node.style.width = '';
							BX.removeClass(node, 'basket-checkout-container-fixed');
						}

						if (basketScrolledToEnd)
						{
							if (!BX.hasClass(node, 'basket-checkout-container-fixed-hide'))
							{
								BX.addClass(node, 'basket-checkout-container-fixed-hide');
							}
						}
						else if (BX.hasClass(node, 'basket-checkout-container-fixed-hide'))
						{
							BX.removeClass(node, 'basket-checkout-container-fixed-hide');
						}
					}
				}
			}

			if (this.useItemsFilter)
			{
				var itemWrapperNode = this.getCacheNode(this.ids.itemListWrapper);

				node = this.getEntity(itemWrapperNode, 'basket-items-list-header');
				if (BX.type.isDomNode(node))
				{
					position = BX.pos(itemWrapperNode);

					if ((scrollTop + offset >= position.top) && !basketScrolledToEnd)
					{
						if (!BX.hasClass(node, 'basket-items-list-header-fixed'))
						{
							node.style.width = node.clientWidth + border + 'px';

							itemWrapperNode.style.paddingTop = node.clientHeight + 'px';

							BX.addClass(node, 'basket-items-list-header-fixed');
						}

						if (offset)
						{
							node.style.top = offset + 'px';
						}

						offset += node.clientHeight;
					}
					else if (BX.hasClass(node, 'basket-items-list-header-fixed'))
					{
						itemWrapperNode.style.paddingTop = '';

						node.style.width = '';
						node.style.top = '';

						BX.removeClass(node, 'basket-items-list-header-fixed');
					}
				}
			}

			var offsetChanged = this.stickyHeaderOffset === offset;

			this.stickyHeaderOffset = offset;

			if (offsetChanged && !basketScrolledToEnd)
			{
				this.adjustBasketWrapperHeight();
			}
		},

		getDocumentScrollTop: function()
		{
			return window.scrollY
				|| window.pageYOffset
				|| document.body.scrollTop + (document.documentElement && document.documentElement.scrollTop || 0);
		},

		lazyLoad: function()
		{
			var itemsNodePosition = BX.pos(this.getCacheNode(this.ids.itemListContainer));

			if (this.getDocumentScrollTop() + window.innerHeight >= itemsNodePosition.bottom - 400)
			{
				var itemIds = this.getItemsAfter();
				if (itemIds.length)
				{
					this.editBasketItems(itemIds);
				}
			}
		},

		fireCustomEvents: function()
		{
			if (this.result.EVENT_ONCHANGE_ON_START === 'Y')
			{
				BX.onCustomEvent('OnBasketChange');
			}
		},

		adjustBasketWrapperHeight: function()
		{
			var itemListContainer = this.getCacheNode(this.ids.itemListContainer),
				itemList = this.getCacheNode(this.ids.itemList);

			if (BX.type.isDomNode(itemListContainer) && BX.type.isDomNode(itemList))
			{
				if (itemListContainer.clientHeight + this.stickyHeaderOffset > window.innerHeight)
				{
					//itemListContainer.style.minHeight = 'calc(100vh - 15px - ' + this.stickyHeaderOffset + 'px)';
					//itemList.style.minHeight = 'calc(100vh - 15px - ' + this.stickyHeaderOffset + 'px)';
				}
				else
				{
					//itemListContainer.style.minHeight = itemListContainer.clientHeight + 'px';
					//itemList.style.minHeight = itemListContainer.clientHeight + 'px';
				}
			}
		},

		editTotal: function()
		{
			this.fillTotalBlocks();
			this.showItemsCount();
			this.showWarningItemsCount();
			this.showNotAvailableItemsCount();
			this.showDelayedItemsCount();
		},

		fillTotalBlocks: function()
		{
			var totalNodes = this.getEntities(this.getCacheNode(this.ids.basketRoot), 'basket-total-block');

			if (totalNodes && totalNodes.length)
			{
				var totalTemplate = this.getTemplate('basket-total-template');
				if (totalTemplate)
				{
					var totalRender = this.render(totalTemplate, this.result.TOTAL_RENDER_DATA);

					for (var i in totalNodes)
					{
						if (totalNodes.hasOwnProperty(i) && BX.type.isDomNode(totalNodes[i]))
						{
							totalNodes[i].innerHTML = totalRender;

							this.bindTotalEvents(totalNodes[i]);
						}
					}
				}
			}

			this.checkStickyHeaders();
		},

		showItemsCount: function()
		{
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="all"]'
			);

			if (BX.type.isDomNode(itemCountNode))
			{
				itemCountNode.innerHTML = BX.message('SBB_IN_BASKET') + ' ' + this.result.BASKET_ITEMS_COUNT + ' ' + this.getGoodsMessage(this.result.BASKET_ITEMS_COUNT);
				itemCountNode.style.display = '';
			}
		},

		showSimilarCount: function(state)
		{
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="similar"]'
			);

			if (BX.type.isDomNode(itemCountNode))
			{
				if (state)
				{
					itemCountNode.innerHTML = this.sortedItems.length + ' '
						+ this.getGoodsMessage(this.result.BASKET_ITEMS_COUNT, 'SBB_SIMILAR_ITEM');
					itemCountNode.style.display = '';
				}
				else
				{
					itemCountNode.style.display = 'none';
				}
			}
		},

		showWarningItemsCount: function()
		{
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="warning"]'
			);

			if (BX.type.isDomNode(itemCountNode))
			{
				if (this.warningItems.length)
				{
					itemCountNode.innerHTML = this.warningItems.length + ' ' + BX.message('SBB_BASKET_ITEMS_WARNING');
					itemCountNode.style.display = '';
				}
				else
				{
					itemCountNode.style.display = 'none';
				}
			}
		},

		showNotAvailableItemsCount: function()
		{
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="not-available"]'
			);

			if (BX.type.isDomNode(itemCountNode))
			{
				if (parseInt(this.result.NOT_AVAILABLE_BASKET_ITEMS_COUNT))
				{
					itemCountNode.innerHTML = this.result.NOT_AVAILABLE_BASKET_ITEMS_COUNT + ' '
						+ this.getGoodsMessage(this.result.NOT_AVAILABLE_BASKET_ITEMS_COUNT, 'SBB_NOT_AVAILABLE_ITEM');
					itemCountNode.style.display = '';
				}
				else
				{
					itemCountNode.style.display = 'none';
				}
			}
		},

		showDelayedItemsCount: function()
		{
			var itemCountNode = this.getEntity(
				this.getCacheNode(this.ids.itemListWrapper),
				'basket-items-count',
				'[data-filter="delayed"]'
			);

			if (BX.type.isDomNode(itemCountNode))
			{
				if (parseInt(this.result.DELAYED_BASKET_ITEMS_COUNT))
				{
					itemCountNode.innerHTML = this.result.DELAYED_BASKET_ITEMS_COUNT + ' '
						+ this.getGoodsMessage(this.result.DELAYED_BASKET_ITEMS_COUNT, 'SBB_DELAYED_ITEM');
					itemCountNode.style.display = '';
				}
				else
				{
					itemCountNode.style.display = 'none';
				}
			}
		},

		getGoodsMessage: function(count, customMessage)
		{
			var mesCode;
			var countReminder = (count > 10 && count < 20) ? 0 : count % 10;

			if (countReminder === 1)
			{
				mesCode = customMessage || 'SBB_GOOD';
			}
			else if (countReminder >= 2 && countReminder <= 4)
			{
				mesCode = customMessage ? customMessage + '_2' : 'SBB_GOOD_2';
			}
			else
			{
				mesCode = customMessage ? customMessage + 'S' : 'SBB_GOODS';
			}

			return BX.message(mesCode);
		},

		bindTotalEvents: function(node)
		{
			if (!this.result.TOTAL_RENDER_DATA.DISABLE_CHECKOUT)
			{
				BX.bind(this.getEntity(node, 'basket-checkout-button'), 'click', BX.proxy(this.checkOutAction, this));
			}

			BX.bind(this.getEntity(node, 'basket-coupon-input'), 'change', BX.proxy(this.addCouponAction, this));
			BX.bind(this.getEntity(node, 'basket-coupon-input'), 'paste', BX.proxy(this.pasteCouponAction, this));

			var couponNodes = this.getEntities(node, 'basket-coupon-delete');
			for (var i = 0, l = couponNodes.length; i < l; i++)
			{
				BX.bind(couponNodes[i], 'click', BX.proxy(this.removeCouponAction, this));
			}

		},

		checkOutAction: function()
		{
			document.location.href = this.params.PATH_TO_ORDER;
		},

		addCouponAction: function(event)
		{
			var target = BX.getEventTarget(event);
			if (target && target.value)
			{
				this.actionPool.addCoupon(target.value);
				target.disabled = true;
			}
		},

		pasteCouponAction: function(event)
		{
			setTimeout(BX.delegate(function() {
				this.addCouponAction(event);
			}, this), 10);
		},

		removeCouponAction: function()
		{
			var value = BX.proxy_context && BX.util.trim(BX.proxy_context.getAttribute('data-coupon'));
			if (value)
			{
				this.actionPool.removeCoupon(value);
			}
		},

		initializeActionPool: function()
		{
			this.actionPool = new BX.Sale.BasketActionPool(this);
		},

		initializeFilter: function()
		{
			this.filter = new BX.Sale.BasketFilter(this);
		},

		/**
		 * Send ajax request with basket data and executes callback by action
		 */
		sendRequest: function(action, data)
		{
			this.lastAction = action;

			if (this.lastAction === 'recalculateAjax')
			{
				// we use it to reload all items if applied discounts changed
				data.lastAppliedDiscounts = BX.util.array_keys(this.result.FULL_DISCOUNT_LIST).join(',');

				if (this.params.USE_ENHANCED_ECOMMERCE === 'Y')
				{
					this.checkAnalytics(data);
				}
			}

			BX.ajax({
				method: 'POST',
				dataType: 'json',
				url: this.ajaxUrl,
				data: this.getData(data),
				onsuccess: BX.delegate(function(result) {
					this.actionPool.doProcessing(false);

					if (!BX.type.isPlainObject(result))
						return;

					this.actionPool.setRefreshStatus(result.BASKET_REFRESHED);

					if (result.RESTORED_BASKET_ITEMS)
					{
						this.restoreBasketItems(result.RESTORED_BASKET_ITEMS);
					}

					if (result.DELETED_BASKET_ITEMS)
					{
						this.deleteBasketItems(result.DELETED_BASKET_ITEMS, this.params.SHOW_RESTORE === 'Y');

					}

					if (result.MERGED_BASKET_ITEMS)
					{
						this.deleteBasketItems(result.MERGED_BASKET_ITEMS, false, true);

					}

					this.applyBasketResult(result.BASKET_DATA);
					this.editBasketItems(this.getItemsToEdit());
					this.editTotal();

					this.adjustBasketWrapperHeight();
					this.applyPriceAnimation();
					this.editWarnings();

					this.actionPool.switchTimer();

					if (this.isBasketIntegrated() && this.isBasketChanged())
					{
						BX.Sale.OrderAjaxComponent.sendRequest();
					}
                    // обновляем количество товара в меню
                    let menu = $('#nav');
                    let elem_cart_count = menu.find('.basket .count');
                    let current_val = elem_cart_count.text();
                    let parent = $('.basket-items-list-wrapper .basket-items-list-table');
                    let list_container = $('.basket-items-list-item-container');
                    if(current_val != result.BASKET_DATA.ORDERABLE_BASKET_ITEMS_COUNT){
                    	if(result.BASKET_DATA.ORDERABLE_BASKET_ITEMS_COUNT == null){
                            result.BASKET_DATA.ORDERABLE_BASKET_ITEMS_COUNT = 0;
                            let text = 'Ваша корзина пуста';
                            let text2 = 'Нажмите <a href="/shop/" >здесь,</a> чтобы продолжить покупки';
                            $('<div>').attr('class','bx-sbb-empty-cart-container')
								.append($('<div>').attr('class','bx-sbb-empty-cart-image').css({'margin-top':'24px'}))
								.append($('<div>').attr('class','bx-sbb-empty-cart-text')
									.append(text))
								.append($('<div>').attr('class','bx-sbb-empty-cart-desc')
									.append(text2))
								.appendTo(parent);
                            list_container.remove();
						}
                        elem_cart_count.text(result.BASKET_DATA.ORDERABLE_BASKET_ITEMS_COUNT);
					}
				}, this),
				onfailure: BX.delegate(function() {
					this.actionPool.doProcessing(false);
				}, this)
			});
		},

		isBasketIntegrated: function()
		{
			return this.params.BASKET_WITH_ORDER_INTEGRATION === 'Y';
		},

		isBasketChanged: function()
		{
			return this.changedItems.length;
		},

		addPriceAnimationData: function(nodeId, start, finish, currency)
		{
			if (!BX.type.isPlainObject(this.priceAnimationData))
			{
				this.clearPriceAnimationData();
			}

			this.priceAnimationData.start[nodeId] = parseFloat(start);
			this.priceAnimationData.finish[nodeId] = parseFloat(finish);
			this.priceAnimationData.currency[nodeId] = currency;
			this.priceAnimationData.int[nodeId] = (parseFloat(start) === parseInt(start)) && (parseFloat(finish) === parseInt(finish));
		},

		clearPriceAnimationData: function()
		{
			this.priceAnimationData = {
				start: {},
				finish: {},
				currency: {},
				int: {}
			};
		},

		applyBasketResult: function(result)
		{
			this.changedItems = [];
			this.clearPriceAnimationData();

			if (!BX.type.isPlainObject(result))
			{
				return;
			}

			if (result.BASKET_ITEM_RENDER_DATA)
			{
				var i, newData;

				for (i in result.BASKET_ITEM_RENDER_DATA)
				{
					if (result.BASKET_ITEM_RENDER_DATA.hasOwnProperty(i))
					{
						newData = result.BASKET_ITEM_RENDER_DATA[i];
						newData.WARNINGS = this.checkBasketItemWarnings(newData, result.WARNING_MESSAGE_WITH_CODE);

						if (this.items[newData.ID])
						{
							if (JSON.stringify(this.items[newData.ID]) === JSON.stringify(newData))
							{
								continue;
							}
						}
						else
						{
							this.addSortedItem(newData.ID, true);
						}

						this.changedItems.push(newData.ID);

						newData = this.checkBasketItemsAnimation(newData);
						this.items[newData.ID] = newData;
					}
				}

				this.changedItems = BX.util.array_unique(this.changedItems.concat(this.getChangedSimilarOffers()));

				if (this.isBasketChanged())
				{
					this.sortSortedItems(true);
				}
			}

			if (result.TOTAL_RENDER_DATA)
			{
				result.TOTAL_RENDER_DATA = this.checkTotalAnimation(result.TOTAL_RENDER_DATA);
			}

			this.result = result;
		},

		itemSortFunction: function(a, b)
		{
			if (!this.items.hasOwnProperty(a) || !this.items.hasOwnProperty(b))
			{
				return 0;
			}

			return parseFloat(this.items[a].SORT) - parseFloat(this.items[b].SORT);
		},

		getChangedSimilarOffers: function()
		{
			var changedSimilarOffers = [];

			var otherSimilarItemsQuantity, totalSimilarItemsQuantity;
			var hashMap = this.getHashMap();

			for (var hash in hashMap)
			{
				if (hashMap.hasOwnProperty(hash))
				{
					if (hashMap[hash].length > 1)
					{
						for (var i = 0; i < hashMap[hash].length; i++)
						{
							otherSimilarItemsQuantity = 0;
							totalSimilarItemsQuantity = 0;

							for (var k = 0; k < hashMap[hash].length; k ++)
							{
								if (hashMap[hash][k] != hashMap[hash][i])
								{
									otherSimilarItemsQuantity += parseFloat(this.items[hashMap[hash][k]].QUANTITY);
								}

								totalSimilarItemsQuantity += parseFloat(this.items[hashMap[hash][k]].QUANTITY);
							}

							if (
								!this.items[hashMap[hash][i]].HAS_SIMILAR_ITEMS
								|| this.items[hashMap[hash][i]].SIMILAR_ITEMS_QUANTITY != otherSimilarItemsQuantity
								|| this.items[hashMap[hash][i]].TOTAL_SIMILAR_ITEMS_QUANTITY != totalSimilarItemsQuantity
							)
							{
								changedSimilarOffers.push(hashMap[hash][i]);

								this.items[hashMap[hash][i]].HAS_SIMILAR_ITEMS = true;
								this.items[hashMap[hash][i]].SIMILAR_ITEMS_QUANTITY = otherSimilarItemsQuantity;
								this.items[hashMap[hash][i]].TOTAL_SIMILAR_ITEMS_QUANTITY = totalSimilarItemsQuantity;

								this.items[hashMap[hash][i]].ALL_AVAILABLE_QUANTITY = this.items[hashMap[hash][i]].AVAILABLE_QUANTITY;
								this.items[hashMap[hash][i]].AVAILABLE_QUANTITY = this.items[hashMap[hash][i]].ALL_AVAILABLE_QUANTITY - otherSimilarItemsQuantity;
							}
						}
					}
					else if (hashMap[hash][0] && this.items[hashMap[hash][0]].HAS_SIMILAR_ITEMS)
					{
						changedSimilarOffers.push(hashMap[hash][0]);

						delete this.items[hashMap[hash][0]].HAS_SIMILAR_ITEMS;
						delete this.items[hashMap[hash][0]].SIMILAR_ITEMS_QUANTITY;
						delete this.items[hashMap[hash][0]].TOTAL_SIMILAR_ITEMS_QUANTITY;

						this.items[hashMap[hash][0]].AVAILABLE_QUANTITY = this.items[hashMap[hash][0]].ALL_AVAILABLE_QUANTITY;
						delete this.items[hashMap[hash][0]].ALL_AVAILABLE_QUANTITY;
					}
				}
			}

			return changedSimilarOffers;
		},

		getHashMap: function()
		{
			var hashMap = {};

			for (var id in this.items)
			{
				if (this.items.hasOwnProperty(id) && this.isItemAvailable(id))
				{
					if (!hashMap.hasOwnProperty(this.items[id].HASH))
					{
						hashMap[this.items[id].HASH] = [];
					}

					hashMap[this.items[id].HASH].push(id);
				}
			}

			return hashMap;
		},

		isItemAvailable: function(itemId)
		{
			var sortedItems = this.filter.isActive() ? this.filter.realSortedItems : this.sortedItems;

			return !this.items[itemId].NOT_AVAILABLE
				&& !this.items[itemId].SHOW_RESTORE
				&& BX.util.in_array(itemId, sortedItems);
		},

		checkTotalAnimation: function(totalData)
		{
			if (this.result && this.result.TOTAL_RENDER_DATA && parseFloat(this.result.TOTAL_RENDER_DATA.PRICE) > parseFloat(totalData.PRICE))
			{
				totalData.PRICE_NEW = totalData.PRICE;
				totalData.PRICE = this.result.TOTAL_RENDER_DATA.PRICE;

				totalData.PRICE_FORMATED_NEW = totalData.PRICE_FORMATED;
				totalData.PRICE_FORMATED = this.result.TOTAL_RENDER_DATA.PRICE_FORMATED;

				this.addPriceAnimationData(this.ids.total, totalData.PRICE, totalData.PRICE_NEW, totalData.CURRENCY);
			}

			return totalData;
		},

		checkBasketItemsAnimation: function(itemData)
		{
			var itemId = itemData.ID;

			if (this.items[itemId])
			{
				var quantityNode = BX(this.ids.quantity + itemId);
				if (
					BX.type.isDomNode(quantityNode)
					&& !this.actionPool.isItemInPool(itemId)
					&& parseFloat(quantityNode.value) !== parseFloat(itemData.QUANTITY)
				)
				{
					itemData.QUANTITY_ANIMATION = true;
					this.actionPool.clearLastActualQuantityPool(itemId);
				}

				if (parseFloat(this.items[itemId].PRICE) > parseFloat(itemData.PRICE))
				{
					itemData.PRICE_NEW = itemData.PRICE;
					itemData.PRICE = this.items[itemId].PRICE;

					itemData.PRICE_FORMATED_NEW = itemData.PRICE_FORMATED;
					itemData.PRICE_FORMATED = this.items[itemId].PRICE_FORMATED;

					this.addPriceAnimationData(this.ids.price + itemId, itemData.PRICE, itemData.PRICE_NEW, itemData.CURRENCY);
				}

				if (
					BX.util.in_array('SUM', this.params.COLUMNS_LIST)
					&& parseFloat(this.items[itemId].SUM_PRICE) > parseFloat(itemData.SUM_PRICE)
					&& parseFloat(this.items[itemId].QUANTITY) === parseFloat(itemData.QUANTITY)
				)
				{
					itemData.SUM_PRICE_NEW = itemData.SUM_PRICE;
					itemData.SUM_PRICE = this.items[itemId].SUM_PRICE;

					itemData.SUM_PRICE_FORMATED_NEW = itemData.SUM_PRICE_FORMATED;
					itemData.SUM_PRICE_FORMATED = this.items[itemId].SUM_PRICE_FORMATED;

					this.addPriceAnimationData(this.ids.sumPrice + itemId, itemData.SUM_PRICE, itemData.SUM_PRICE_NEW, itemData.CURRENCY);
				}
			}

			return itemData;
		},

		getData: function(data)
		{
			data = data || {};

			data[this.params.ACTION_VARIABLE] = this.lastAction;
			data.via_ajax = 'Y';
			data.site_id = this.siteId;
			data.sessid = BX.bitrix_sessid();
			data.template = this.template;
			data.signedParamsString = this.signedParamsString;

			return data;
		},

		startLoader: function()
		{
			// if (!this.loadingScreen)
			// {
			// 	this.loadingScreen = new BX.PopupWindow('loading_screen', null, {
			// 		events: {
			// 			onAfterPopupShow: BX.delegate(function() {
			// 				BX.cleanNode(this.loadingScreen.popupContainer);
			// 				BX.removeClass(this.loadingScreen.popupContainer, 'popup-window');
			// 				this.loadingScreen.popupContainer.appendChild(
			// 					BX.create('IMG', {props: {src: this.templateFolder + '/images/loader.gif'}})
			// 				);
			// 				this.loadingScreen.popupContainer.removeAttribute('style');
			// 				this.loadingScreen.popupContainer.style.display = 'block';
			// 			}, this)
			// 		}
			// 	});
			// 	BX.addClass(this.loadingScreen.popupContainer, 'bx-step-opacity');
			// }
			//
			// this.loadingScreen.show();
		},

		/**
		 * Hiding loader image with overlay.
		 */
		endLoader: function()
		{
			// if (this.loadingScreen && this.loadingScreen.isShown())
			// {
			// 	this.loadingScreen.close();
			// }
		},

		editWarnings: function()
		{
			this.editGeneralWarnings();
			this.editBasketItemWarnings();
			this.toggleWarningBlock();
			this.showWarningItemsCount();
		},

		editGeneralWarnings: function()
		{
			var warningsNode = this.getEntity(this.getCacheNode(this.ids.warning), 'basket-general-warnings');

			if (BX.type.isDomNode(warningsNode))
			{
				var generalWarningText = warningsNode.innerHTML;

				if (this.result.WARNING_MESSAGE_WITH_CODE)
				{
					for (var code in this.result.WARNING_MESSAGE_WITH_CODE)
					{
						if (this.result.WARNING_MESSAGE_WITH_CODE.hasOwnProperty(code))
						{
							if (
								!this.items[code]
								&& generalWarningText.indexOf(this.result.WARNING_MESSAGE_WITH_CODE[code]) === -1
							)
							{
								generalWarningText += this.result.WARNING_MESSAGE_WITH_CODE[code] + '<br/>';
							}
						}
					}
				}

				if (generalWarningText)
				{
					warningsNode.innerHTML = generalWarningText;
					warningsNode.style.display = '';
				}
				else
				{
					warningsNode.style.display = 'none';
					warningsNode.innerHTML = '';
				}
			}
		},

		editBasketItemWarnings: function()
		{
			var itemsWarningsNode = this.getEntity(this.getCacheNode(this.ids.warning), 'basket-item-warnings');

			if (BX.type.isDomNode(itemsWarningsNode))
			{
				if (this.warningItems.length)
				{
					var warningCount = this.getEntity(itemsWarningsNode, 'basket-items-warning-count');
					if (BX.type.isDomNode(warningCount))
					{
						warningCount.innerHTML = this.warningItems.length + ' ' + this.getGoodsMessage(this.warningItems.length);
					}

					itemsWarningsNode.style.display = '';
				}
				else if (itemsWarningsNode.style.display !== 'none')
				{
					itemsWarningsNode.style.display = 'none';

					if (this.filter.isActive())
					{
						this.toggleFilter('all');
					}
				}
			}
		},

		toggleWarningBlock: function()
		{
			var warningNode = this.getCacheNode(this.ids.warning);

			if (BX.type.isDomNode(warningNode))
			{
				var generalWarningNode = this.getEntity(warningNode, 'basket-general-warnings');
				var itemsWarningsNode = this.getEntity(warningNode, 'basket-item-warnings');

				if (
					(!BX.type.isDomNode(generalWarningNode) || generalWarningNode.style.display === 'none')
					&& (!BX.type.isDomNode(itemsWarningsNode) || itemsWarningsNode.style.display === 'none')
				)
				{
					warningNode.style.display = 'none';
				}
				else
				{
					warningNode.style.display = '';
				}
			}
		},

		checkBasketItemWarnings: function(itemData, warnings)
		{
			if (!itemData)
				return;

			var itemWarnings;

			if (this.items[itemData.ID] && this.lastAction === 'refreshAjax')
			{
				itemWarnings = this.items[itemData.ID].WARNINGS;
			}
			else
			{
				itemWarnings = [];
			}

			if (BX.type.isArray(warnings[itemData.ID]) && warnings[itemData.ID].length)
			{
				for (var i in warnings[itemData.ID])
				{
					if (warnings[itemData.ID].hasOwnProperty(i) && !BX.util.in_array(warnings[itemData.ID][i], itemWarnings))
					{
						itemWarnings.push(warnings[itemData.ID][i]);
					}
				}
			}

			if (itemWarnings.length)
			{
				if (!BX.util.in_array(itemData.ID, this.warningItems))
				{
					this.warningItems.push(itemData.ID);
				}
			}
			else if (BX.util.in_array(itemData.ID, this.warningItems))
			{
				this.warningItems.splice(BX.util.array_search(itemData.ID, this.warningItems), 1);
			}

			return itemWarnings;
		},

		removeAllWarnings: function(event)
		{
			this.clearGeneralWarnings();
			this.clearBasketItemsWarnings();

			this.editWarnings();

			event && event.preventDefault();
		},

		clearGeneralWarnings: function()
		{
			this.result.WARNING_MESSAGE_WITH_CODE = {};

			var generalWarningNode = this.getEntity(this.getCacheNode(this.ids.warning), 'basket-general-warnings');

			if (BX.type.isDomNode(generalWarningNode))
			{
				generalWarningNode.innerHTML = '';
			}
		},

		clearBasketItemsWarnings: function()
		{
			var itemsToEdit = [];

			for (var i in this.warningItems)
			{
				if (this.warningItems.hasOwnProperty(i))
				{
					this.items[this.warningItems[i]].WARNINGS = [];

					if (this.isItemShown(this.warningItems[i]))
					{
						itemsToEdit.push(this.warningItems[i]);
					}
				}
			}

			this.warningItems = [];
			this.editBasketItems(itemsToEdit);
		},

		isItemShown: function(itemId)
		{
			return BX.util.in_array(itemId, this.shownItems);
		},

		initializeBasketItems: function()
		{
			if (Object.keys(this.items).length === 0)
				return;

			for (var i = 0; i < this.sortedItems.length; i++)
			{
				if (this.useDynamicScroll && this.shownItems.length >= this.maxItemsShowCount)
				{
					break;
				}

				this.createBasketItem(this.sortedItems[i]);
			}
			this.showInfoBlock();
		},
		showInfoBlock: function(){
            // обновляем количество товара в меню
            let parent = $('.basket-items-list-table');
            let text = 'Бесплатная доставка при заказе от 2500 рублей';
            $('<div>').attr('class','basket-items-list-item-container')
                .append($('<div>').attr('class','description info-container')
                    .append($('<div>').attr('class','image'))
                    .append($('<div>').attr('class','text')
                        .append(text))
				)
                .appendTo(parent);
		},
		createBasketItem: function(itemId)
		{
			if (!this.items[itemId])
			{
				return;
			}

			var basketItemTemplate = this.getTemplate('basket-item-template');
			if (basketItemTemplate)
			{
				var basketItemHtml = this.renderBasketItem(basketItemTemplate, this.items[itemId]);
				var sortIndex = BX.util.array_search(itemId, this.sortedItems);

				if (this.shownItems.length && sortIndex >= 0)
				{
					if (sortIndex < BX.util.array_search(this.shownItems[0], this.sortedItems))
					{
						// insert before
						BX(this.ids.item + this.shownItems[0]).insertAdjacentHTML('beforebegin', basketItemHtml);
						this.shownItems.unshift(itemId);
					}
					else if (sortIndex > BX.util.array_search(this.shownItems[this.shownItems.length - 1], this.sortedItems))
					{
						// insert after
						BX(this.ids.item + this.shownItems[this.shownItems.length - 1]).insertAdjacentHTML('afterend', basketItemHtml);
						this.shownItems.push(itemId);
					}
					else
					{
						// insert between
						BX(this.ids.item + this.sortedItems[sortIndex + 1]).insertAdjacentHTML('beforebegin', basketItemHtml);
						this.shownItems.splice(sortIndex + 1, 0, itemId);
					}
				}
				else
				{
					this.getCacheNode(this.ids.itemListTable).insertAdjacentHTML('beforeend', basketItemHtml);
					this.shownItems.push(itemId);
				}

				this.bindBasketItemEvents(this.items[itemId]);

				if (this.filter.isActive())
				{
					this.filter.highlightSearchMatch(this.items[itemId]);
				}
			}
		},

		getItemsToEdit: function()
		{
			var itemIds = [];

			if (this.isBasketChanged())
			{
				for (var i in this.changedItems)
				{
					if (this.changedItems.hasOwnProperty(i) && this.isItemShown(this.changedItems[i]))
					{
						itemIds.push(this.changedItems[i]);
					}
				}
			}

			return itemIds;
		},

		getItemsAfter: function()
		{
			var itemIdsAfter = [];

			if (this.useDynamicScroll)
			{
				var lastShownItemId = this.shownItems[this.shownItems.length - 1] || false;

				if (lastShownItemId)
				{
					var i = 0;
					var index = BX.util.array_search(lastShownItemId, this.sortedItems);

					while (this.sortedItems[++index] && i++ < this.maxItemsShowCount)
					{
						itemIdsAfter.push(this.sortedItems[index]);
					}
				}
			}

			return itemIdsAfter;
		},

		editBasketItems: function(itemIds)
		{
			if (!itemIds || itemIds.length === 0)
			{
				return;
			}

			var i, item;

			for (i in itemIds)
			{
				if (!itemIds.hasOwnProperty(i) || !BX.type.isPlainObject(this.items[itemIds[i]]))
				{
					continue;
				}

				item = this.items[itemIds[i]];

				if (this.actionPool.isItemInPool(item.ID))
				{
					if (!BX.util.in_array(item.ID, this.postponedItems))
					{
						this.postponedItems.push(item.ID);
					}

					continue;
				}

				if (BX.type.isDomNode(BX(this.ids.item + item.ID)))
				{
					this.redrawBasketItemNode(item.ID);
					this.applyQuantityAnimation(item.ID);
				}
				else
				{
					this.createBasketItem(item.ID);
				}
			}
		},

		editPostponedBasketItems: function()
		{
			if (!this.postponedItems.length)
				return;

			var itemsToEdit = [];

			for (var i in this.postponedItems)
			{
				if (this.postponedItems.hasOwnProperty(i) && this.isItemShown(this.postponedItems[i]))
				{
					itemsToEdit.push(this.postponedItems[i]);
				}
			}

			this.postponedItems = [];
			this.editBasketItems(itemsToEdit);
		},

		applyQuantityAnimation: function(itemId)
		{
			var basketItemNode = BX(this.ids.item + itemId);

			if (BX.type.isDomNode(basketItemNode) && this.items[itemId])
			{
				if (this.items[itemId].QUANTITY_ANIMATION)
				{
					BX.addClass(BX(this.ids.quantity + itemId), 'basket-updated');
				}
			}
		},

		applyPriceAnimation: function()
		{
			if (!this.priceAnimationData || Object.keys(this.priceAnimationData.start).length === 0)
				return;

			var animationData = this.priceAnimationData,
				nodeCache = {};

			new BX.easing({
				duration: this.params.USE_PRICE_ANIMATION === 'Y' ? this.duration.priceAnimation : 1,
				start: animationData.start,
				finish: animationData.finish,
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
				step: BX.delegate(function(state){
					for (var nodeId in animationData.start)
					{
						if (animationData.start.hasOwnProperty(nodeId))
						{
							if (!nodeCache[nodeId])
							{
								if (nodeId === this.ids.total)
								{
									nodeCache[nodeId] = this.getEntities(this.getCacheNode(this.ids.basketRoot), this.ids.total);
								}
								else
								{
									var node = BX(nodeId);
									nodeCache[nodeId] = node ? [node] : [];
								}
							}

							if (!animationData.int[nodeId])
							{
								// fix price blinking
								state[nodeId] = (state[nodeId] + (state[nodeId] % 1000) / 1000).toFixed(5);
							}

							for (var i = 0; i < nodeCache[nodeId].length; i++)
							{
								nodeCache[nodeId][i].innerHTML = this.getFormatPrice(state[nodeId], animationData.currency[nodeId]);
							}
						}
					}
				}, this),
				complete: BX.delegate(function() {
					var nodeId, formattedPrice, itemId, type;

					for (nodeId in animationData.start)
					{
						if (animationData.start.hasOwnProperty(nodeId))
						{
							formattedPrice = this.getFormatPrice(animationData.finish[nodeId], animationData.currency[nodeId]);

							for (var i = 0; i < nodeCache[nodeId].length; i++)
							{
								nodeCache[nodeId][i].innerHTML = formattedPrice;
							}

							if (nodeId.indexOf(this.ids.sumPrice) !== -1)
							{
								type = 'SUM_PRICE';
								itemId = nodeId.substr(this.ids.sumPrice.length);
							}
							else if (nodeId.indexOf(this.ids.price) !== -1)
							{
								type = 'PRICE';
								itemId = nodeId.substr(this.ids.price.length);
							}
							else if (nodeId.indexOf(this.ids.total) !== -1)
							{
								type = 'TOTAL';
								itemId = '';
							}
							else
							{
								itemId = '';
								type = '';
							}

							if (BX.type.isNotEmptyString(type))
							{
								if (itemId)
								{
									this.items[itemId][type] = animationData.finish[nodeId];
									delete this.items[itemId][type + '_NEW'];
									this.items[itemId][type + '_FORMATED'] = formattedPrice;
									delete this.items[itemId][type + '_FORMATED_NEW'];
								}
								else if (type === 'TOTAL')
								{
									this.result.TOTAL_RENDER_DATA.PRICE = animationData.finish[nodeId];
									delete this.result.TOTAL_RENDER_DATA.PRICE_NEW;
									this.result.TOTAL_RENDER_DATA.PRICE_FORMATED = formattedPrice;
									delete this.result.TOTAL_RENDER_DATA.PRICE_FORMATED_NEW;
								}
							}
						}
					}

					this.filter.highlightFoundItems();
				}, this)
			}).animate();
		},

		getFormatPrice: function(price, currency)
		{
			return BX.Currency.currencyFormat(price, currency, true);
		},

		deleteBasketItems: function(items, restore, final)
		{
			if (!items || !items.length)
			{
				return;
			}

			for (var i in items)
			{
				if (items.hasOwnProperty(i))
				{
					this.deleteBasketItem(items[i], restore, final);
				}
			}
		},

		deleteBasketItem: function(itemId, restore, final)
		{
			// delete not available item with no chance to restore
			if (this.items[itemId].NOT_AVAILABLE && restore)
			{
				restore = false;
				final = true;
			}

			if (restore)
			{
				this.items[itemId].SHOW_RESTORE = true;
				this.items[itemId].SHOW_LOADING = false;
				this.redrawBasketItemNode(itemId);
			}
			else
			{
				this.changeShownItem(itemId);
				BX.remove(BX(this.ids.item + itemId));
			}

			if (final)
			{
				this.changeSortedItem(itemId, false, true);
				this.changeShownItem(itemId, false, true);
			}
		},

		addSortedItem: function(itemId, all)
		{
			this.sortedItems.push(itemId.toString());

			if (all && this.filter.isActive())
			{
				this.filter.realSortedItems.push(itemId.toString());
			}
		},

		changeSortedItem: function(itemId, newItemId, all)
		{
			var index = BX.util.array_search(itemId, this.sortedItems);

			if (index >= 0)
			{
				if (newItemId)
				{
					this.sortedItems.splice(index, 1, newItemId.toString());
				}
				else
				{
					this.sortedItems.splice(index, 1);
				}
			}

			if (all && this.filter.isActive())
			{
				index = BX.util.array_search(itemId, this.filter.realSortedItems);

				if (index >= 0)
				{
					if (newItemId)
					{
						this.filter.realSortedItems.splice(index, 1, newItemId.toString());
					}
					else
					{
						this.filter.realSortedItems.splice(index, 1);
					}
				}
			}
		},

		sortSortedItems: function(all)
		{
			this.sortedItems.sort(BX.proxy(this.itemSortFunction, this));

			if (all && this.filter.isActive())
			{
				this.filter.realSortedItems.sort(BX.proxy(this.itemSortFunction, this));
			}
		},

		changeShownItem: function(itemId, newItemId, all)
		{
			var index = BX.util.array_search(itemId, this.shownItems);

			if (index >= 0)
			{
				if (newItemId)
				{
					this.shownItems.splice(index, 1, newItemId.toString());
				}
				else
				{
					this.shownItems.splice(index, 1);
				}
			}

			if (all && this.filter.isActive())
			{
				index = BX.util.array_search(itemId, this.filter.realShownItems);

				if (index >= 0)
				{
					if (newItemId)
					{
						this.filter.realShownItems.splice(index, 1, newItemId.toString());
					}
					else
					{
						this.filter.realShownItems.splice(index, 1);
					}
				}
			}
		},

		redrawBasketItemNode: function(itemId)
		{
			var basketItemNode = BX(this.ids.item + itemId);

			if (!this.items[itemId] || !BX.type.isDomNode(basketItemNode))
				return;

			var basketItemTemplate = this.getTemplate('basket-item-template');
			if (basketItemTemplate)
			{
				var nodeAligner = BX(this.ids.itemHeightAligner + itemId),
					oldHeight;

				if (BX.type.isDomNode(nodeAligner))
				{
					oldHeight = nodeAligner.clientHeight;
				}

				var basketItemHtml = this.renderBasketItem(basketItemTemplate, this.items[itemId]);
				basketItemNode.insertAdjacentHTML('beforebegin', basketItemHtml);
				BX.remove(basketItemNode);

				if (oldHeight)
				{
					nodeAligner = BX(this.ids.itemHeightAligner + itemId);

					if (BX.type.isDomNode(nodeAligner) && nodeAligner.clientHeight < oldHeight)
					{
						nodeAligner.style.minHeight = oldHeight + 'px';
						setTimeout(function(){nodeAligner.style.minHeight = '0px';}, 1);
					}
				}

				this.bindBasketItemEvents(this.items[itemId]);

				if (this.filter.isActive())
				{
					this.filter.highlightSearchMatch(this.items[itemId]);
				}
			}
		},

		restoreBasketItems: function(items)
		{
			if (!items || Object.keys(items).length === 0)
			{
				return;
			}

			var oldItemId, newItemId, basketItemNode;

			for (oldItemId in items)
			{
				if (items.hasOwnProperty(oldItemId))
				{
					newItemId = items[oldItemId];

					if (this.isItemShown(oldItemId))
					{
						this.changeShownItem(oldItemId, newItemId, true);

						basketItemNode = BX(this.ids.item + oldItemId);
						if (BX.type.isDomNode(basketItemNode))
						{
							basketItemNode.id = this.ids.item + newItemId;
							basketItemNode.setAttribute('data-id', newItemId);
						}
					}

					this.changeSortedItem(oldItemId, false, true);
				}
			}
		},

		bindBasketItemEvents: function(itemData)
		{
			if (!itemData)
				return;

			var itemNode = BX(this.ids.item + itemData.ID);
			if (BX.type.isDomNode(itemNode))
			{
				this.bindQuantityEvents(itemNode, itemData);
				this.bindSkuEvents(itemNode, itemData);
				this.bindImageEvents(itemNode, itemData);
				this.bindActionEvents(itemNode, itemData);
				this.bindRestoreAction(itemNode, itemData);
				this.bindItemWarningEvents(itemNode, itemData);
			}
		},

		bindQuantityEvents: function(node, data)
		{
			if (!node || !data || !this.isItemAvailable(data.ID))
				return;

			var entity;

			var block = this.getEntity(node, 'basket-item-quantity-block');
			if (block)
			{
				var startEventName = this.isTouch ? 'touchstart' : 'mousedown';
				var endEventName = this.isTouch ? 'touchend' : 'mouseup';

				entity = this.getEntity(block, 'basket-item-quantity-minus');
				BX.bind(entity, startEventName, BX.proxy(this.startQuantityInterval, this));
				BX.bind(entity, endEventName, BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'mouseout', BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'click', BX.proxy(this.quantityMinus, this));

				entity = this.getEntity(block, 'basket-item-quantity-plus');
				BX.bind(entity, startEventName, BX.proxy(this.startQuantityInterval, this));
				BX.bind(entity, endEventName, BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'mouseout', BX.proxy(this.clearQuantityInterval, this));
				BX.bind(entity, 'click', BX.proxy(this.quantityPlus, this));

				entity = this.getEntity(block, 'basket-item-quantity-field');
				BX.bind(entity, 'change', BX.proxy(this.quantityChange, this));
			}
		},

		startQuantityInterval: function()
		{
			var target = BX.proxy_context;
			var func = target.getAttribute('data-entity') === 'basket-item-quantity-minus'
				? BX.proxy(this.quantityMinus, this)
				: BX.proxy(this.quantityPlus, this);

			this.quantityDelay = setTimeout(
				BX.delegate(function() {
					this.quantityTimer = setInterval(function(){func(target);}, 150);
				}, this),
				300
			);
		},

		clearQuantityInterval: function()
		{
			clearTimeout(this.quantityDelay);
			clearInterval(this.quantityTimer);
		},

		quantityPlus: function(target)
		{
			if (!BX.type.isDomNode(target))
			{
				target = BX.proxy_context;
				this.clearQuantityInterval();
			}

			var itemData = this.getItemDataByTarget(target);
			if (itemData)
			{
				var quantityField = BX(this.ids.quantity + itemData.ID);
				var isQuantityFloat = this.isQuantityFloat(itemData);

				var currentQuantity = isQuantityFloat ? parseFloat(quantityField.value) : Math.round(quantityField.value);
				var measureRatio = isQuantityFloat ? parseFloat(itemData.MEASURE_RATIO) : parseInt(itemData.MEASURE_RATIO);

				var quantity = parseFloat((currentQuantity + measureRatio).toFixed(5));
				quantity = this.getCorrectQuantity(itemData, quantity);

				this.setQuantity(itemData, quantity);
			}
		},

		quantityMinus: function(target)
		{
			target = BX.type.isDomNode(target) ? target : BX.proxy_context;

			var itemData = this.getItemDataByTarget(target);
			if (itemData)
			{
				var quantityField = BX(this.ids.quantity + itemData.ID);
				var isQuantityFloat = this.isQuantityFloat(itemData);

				var currentQuantity = isQuantityFloat ? parseFloat(quantityField.value) : Math.round(quantityField.value);
				var measureRatio = isQuantityFloat ? parseFloat(itemData.MEASURE_RATIO) : parseInt(itemData.MEASURE_RATIO);

				var quantity = parseFloat((currentQuantity - measureRatio).toFixed(5));
				quantity = this.getCorrectQuantity(itemData, quantity);

				this.setQuantity(itemData, quantity);
			}
		},

		quantityChange: function()
		{
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData)
			{
				var quantityField, quantity;

				quantityField = BX(this.ids.quantity + itemData.ID);
				quantity = this.getCorrectQuantity(itemData, quantityField.value);

				this.setQuantity(itemData, quantity);
			}
		},

		isQuantityFloat: function(item)
		{
			return this.params.QUANTITY_FLOAT === 'Y' || (parseInt(item.MEASURE_RATIO) !== parseFloat(item.MEASURE_RATIO));
		},

		getCorrectQuantity: function(itemData, quantity)
		{
			var isQuantityFloat = this.isQuantityFloat(itemData),
				measureRatio = isQuantityFloat ? parseFloat(itemData.MEASURE_RATIO) : parseInt(itemData.MEASURE_RATIO),
				availableQuantity = 0;

			quantity = (isQuantityFloat ? parseFloat(quantity) : parseInt(quantity, 10)) || 0;
			if (quantity < 0)
			{
				quantity = 0;
			}

			if (measureRatio > 0 && quantity < measureRatio)
			{
				quantity = measureRatio;
			}

			if (itemData.CHECK_MAX_QUANTITY === 'Y')
			{
				availableQuantity = isQuantityFloat ? parseFloat(itemData.AVAILABLE_QUANTITY) : parseInt(itemData.AVAILABLE_QUANTITY);
				if (availableQuantity > 0 && quantity > availableQuantity)
				{
					quantity = availableQuantity;
				}
			}

			var reminder = (quantity / measureRatio - ((quantity / measureRatio).toFixed(0))).toFixed(5),
				remain;

			if (parseFloat(reminder) === 0)
			{
				return quantity;
			}

			if (measureRatio !== 0 && measureRatio !== 1)
			{
				remain = (quantity * this.precisionFactor) % (measureRatio * this.precisionFactor) / this.precisionFactor;

				if (measureRatio > 0 && remain > 0)
				{
					if (
						remain >= measureRatio / 2
						&& (
							availableQuantity === 0
							|| (quantity + measureRatio - remain) <= availableQuantity
						)
					)
					{
						quantity += (measureRatio - remain);
					}
					else
					{
						quantity -= remain;
					}
				}
			}

			quantity = isQuantityFloat ? parseFloat(quantity) : parseInt(quantity, 10);

			return quantity;
		},

		setQuantity: function(itemData, quantity)
		{
			var quantityField = BX(this.ids.quantity + itemData.ID),
				currentQuantity;

			if (quantityField)
			{
				quantity = parseFloat(quantity);
				currentQuantity = parseFloat(quantityField.getAttribute('data-value'));

				quantityField.value = quantity;

				if (parseFloat(itemData.QUANTITY) !== parseFloat(quantity))
				{
					this.animatePriceByQuantity(itemData, quantity);
					this.actionPool.changeQuantity(itemData.ID, quantity, currentQuantity);
				}
			}
		},

		animatePriceByQuantity: function(itemData, quantity)
		{
			var priceNode = BX(this.ids.sumPrice + itemData.ID);
			if (!BX.type.isDomNode(priceNode))
				return;

			var quantityMultiplier = quantity / parseFloat(itemData.MEASURE_RATIO);

			var startPrice = parseFloat(itemData.SUM_PRICE),
				finalPrice = parseFloat(itemData.PRICE) * quantityMultiplier,
				isInt = parseInt(startPrice) === parseFloat(startPrice)
					&& parseInt(finalPrice) === parseFloat(finalPrice);

			if (startPrice !== finalPrice)
			{
				this.items[itemData.ID].QUANTITY = quantity;
				this.items[itemData.ID].SUM_PRICE = finalPrice;

				new BX.easing({
					duration: this.params.USE_PRICE_ANIMATION === 'Y' ? this.duration.priceAnimation : 1,
					start: {price: startPrice},
					finish: {price: finalPrice},
					transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
					step: BX.delegate(function(state){
						if (!isInt)
						{
							// fix price blinking
							state.price = (state.price + (state.price % 1000) / 1000).toFixed(5);
						}

						priceNode.innerHTML = this.getFormatPrice(state.price, itemData.CURRENCY);
					}, this),
					complete: BX.delegate(function() {
						var node, price;

						priceNode.innerHTML = this.getFormatPrice(finalPrice, itemData.CURRENCY);

						node = BX(this.ids.sumPriceOld + itemData.ID);
						if (BX.type.isDomNode(node))
						{
							price = parseFloat(itemData.FULL_PRICE) * quantityMultiplier;
							node.innerHTML = this.getFormatPrice(price, itemData.CURRENCY);
						}

						node = BX(this.ids.sumPriceDiff + itemData.ID);
						if (BX.type.isDomNode(node))
						{
							price = parseFloat(itemData.DISCOUNT_PRICE) * quantityMultiplier;
							node.innerHTML = this.getFormatPrice(price, itemData.CURRENCY);
						}
					}, this)
				}).animate();
			}
		},

		getItemDataByTarget: function(target)
		{
			var data = false;
			var id;

			var itemNode = BX.findParent(target, {attrs: {'data-entity': 'basket-item'}});
			if (itemNode)
			{
				id = itemNode.getAttribute('data-id');
				data = this.items[id];
			}

			return data;
		},

		bindSkuEvents: function(node, data)
		{
			if (!node || !data)
				return;

			var blocks = this.getEntities(node, 'basket-item-sku-block');
			var blockEntities, i, l, ii, ll;

			for (i = 0, l = blocks.length; i < l; i++)
			{
				blockEntities = this.getEntities(blocks[i], 'basket-item-sku-field');

				for (ii = 0, ll = blockEntities.length; ii < ll; ii++)
				{
					BX.bind(blockEntities[ii], 'click', BX.proxy(this.changeSku, this));
				}
			}
		},

		changeSku: function()
		{
			var i, l;

			var target = BX.proxy_context;

			if (BX.hasClass(target, 'selected'))
				return;

			var itemData = this.getItemDataByTarget(target);
			if (itemData)
			{
				var basketItemNode = BX(this.ids.item + itemData.ID);
				if (basketItemNode)
				{
					var currentSkuListNodes = this.getEntities(target.parentNode, 'basket-item-sku-field');
					for (i = 0, l = currentSkuListNodes.length; i < l; i++)
					{
						if (currentSkuListNodes[i].isEqualNode(target))
						{
							BX.addClass(currentSkuListNodes[i], 'selected');
						}
						else
						{
							BX.removeClass(currentSkuListNodes[i], 'selected');
						}
					}

					this.actionPool.changeSku(
						itemData.ID,
						this.getSkuPropertyValues(basketItemNode),
						this.getInitialSkuPropertyValues(basketItemNode)
					);
				}
			}
		},

		getSkuPropertyValues: function(basketItemNode)
		{
			var propertyValues = {};

			var propNodes = this.getEntities(basketItemNode, 'basket-item-sku-field', '.selected');
			for (var i = 0, l = propNodes.length; i < l; i++)
			{
				propertyValues[propNodes[i].getAttribute('data-property')] = BX.util.htmlspecialcharsback(propNodes[i].getAttribute('data-value-id'));
			}

			return propertyValues;
		},

		getInitialSkuPropertyValues: function(basketItemNode)
		{
			var propertyValues = {};

			var propNodes = this.getEntities(basketItemNode, 'basket-item-sku-field', '[data-initial="true"]');
			for (var i = 0, l = propNodes.length; i < l; i++)
			{
				propertyValues[propNodes[i].getAttribute('data-property')] = BX.util.htmlspecialcharsback(propNodes[i].getAttribute('data-value-id'));
			}

			return propertyValues;
		},

		bindImageEvents: function(node, data)
		{
			if (!node || !data)
				return;

			var images = node.querySelectorAll('.basket-item-custom-block-photo-item');
			for (var i = 0, l = images.length; i < l; i++)
			{
				BX.bind(images[i], 'click', BX.proxy(this.showPropertyImagePopup, this));
			}
		},

		showPropertyImagePopup: function()
		{
			var target, propertyCode, imageIndex, item, imageSrc, i;

			target = BX.proxy_context;
			item = this.getItemDataByTarget(target);

			propertyCode = target.getAttribute('data-column-property-code');
			imageIndex = target.getAttribute('data-image-index');

			if (item && item.COLUMN_LIST)
			{
				for (i in item.COLUMN_LIST)
				{
					if (
						item.COLUMN_LIST.hasOwnProperty(i)
						&& item.COLUMN_LIST[i].CODE === propertyCode
						&& item.COLUMN_LIST[i].VALUE[imageIndex]
					)
					{
						imageSrc = item.COLUMN_LIST[i].VALUE[imageIndex].IMAGE_SRC_ORIGINAL;
						break;
					}
				}
			}

			if (!imageSrc)
			{
				return;
			}

			if (this.imagePopup)
			{
				this.imagePopup.destroy();
			}

			var imageId = 'bx-soa-image-popup-content';
			var that = this;

			this.imagePopup = new BX.PopupWindow('bx-soa-image-popup', null, {
				lightShadow: true,
				offsetTop: 0,
				offsetLeft: 0,
				closeIcon: {top: '3px', right: '10px'},
				autoHide: true,
				bindOptions: {position: 'bottom'},
				closeByEsc: true,
				zIndex: 100,
				events: {
					onPopupShow: function() {
						BX.create('IMG', {
							props: {src: imageSrc},
							events: {
								load: function() {
									var content = BX(imageId);
									if (content)
									{
										var windowSize = BX.GetWindowInnerSize(),
											ratio = that.isMobile ? 0.5 : 0.9,
											contentHeight, contentWidth;

										BX.cleanNode(content);
										content.appendChild(this);

										contentHeight = content.offsetHeight;
										contentWidth = content.offsetWidth;

										if (contentHeight > windowSize.innerHeight * ratio)
										{
											content.style.height = windowSize.innerHeight * ratio + 'px';
											content.style.width = contentWidth * (windowSize.innerHeight * ratio / contentHeight) + 'px';
											contentHeight = content.offsetHeight;
											contentWidth = content.offsetWidth;
										}

										if (contentWidth > windowSize.innerWidth * ratio)
										{
											content.style.width = windowSize.innerWidth * ratio + 'px';
											content.style.height = contentHeight * (windowSize.innerWidth * ratio / contentWidth) + 'px';
										}

										content.style.height = content.offsetHeight + 'px';
										content.style.width = content.offsetWidth + 'px';

										that.imagePopup.adjustPosition();
									}
								}
							}
						});
					},
					onPopupClose: function() {
						this.destroy();
					}
				},
				content: BX.create('DIV', {props: {id: imageId}})
			});
			this.imagePopup.show();
		},

		bindActionEvents: function(node, data)
		{
			if (!node || !data)
				return;

			var entity;

			if (BX.util.in_array('DELETE', this.params.COLUMNS_LIST))
			{
				entity = this.getEntities(node, 'basket-item-delete');
				for (var i = 0, l = entity.length; i < l; i++)
				{
					BX.bind(entity[i], 'click', BX.proxy(this.deleteAction, this));
				}
			}

			if (BX.util.in_array('DELAY', this.params.COLUMNS_LIST))
			{
				entity = this.getEntity(node, 'basket-item-add-delayed');
				BX.bind(entity, 'click', BX.proxy(this.addDelayedAction, this));
			}

			entity = this.getEntity(node, 'basket-item-remove-delayed');
			BX.bind(entity, 'click', BX.proxy(this.removeDelayedAction, this));

			entity = this.getEntity(node, 'basket-item-merge-sku-link');
			BX.bind(entity, 'click', BX.proxy(this.mergeAction, this));

			entity = this.getEntity(node, 'basket-item-show-similar-link');
			BX.bind(entity, 'click', BX.delegate(function() {this.toggleFilter('similar');}, this));
		},

		deleteAction: function()
		{
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData)
			{
				this.actionPool.deleteItem(itemData.ID);

				this.items[itemData.ID].SHOW_LOADING = true;

				if (this.params.SHOW_RESTORE === 'Y' && this.isItemAvailable(itemData.ID))
				{
					this.items[itemData.ID].SHOW_RESTORE = true;
				}

				this.redrawBasketItemNode(itemData.ID);
			}
		},

		addDelayedAction: function()
		{
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData)
			{
				this.actionPool.addDelayed(itemData.ID);

				this.items[itemData.ID].SHOW_LOADING = true;
				this.redrawBasketItemNode(itemData.ID);
			}
		},

		removeDelayedAction: function()
		{
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData)
			{
				this.actionPool.removeDelayed(itemData.ID);

				this.items[itemData.ID].SHOW_LOADING = true;
				this.redrawBasketItemNode(itemData.ID);
			}
		},

		mergeAction: function()
		{
			var itemData = this.getItemDataByTarget(BX.proxy_context);
			if (itemData)
			{
				this.actionPool.mergeSku(itemData.ID);
			}
		},

		bindRestoreAction: function(node, itemData)
		{
			if (!node || !itemData || this.params.SHOW_RESTORE !== 'Y')
				return;

			BX.bind(
				this.getEntity(node, 'basket-item-restore-button'),
				'click',
				BX.delegate(function() {
					this.actionPool.restoreItem(itemData.ID, {
						PRODUCT_ID: itemData.PRODUCT_ID,
						QUANTITY: itemData.QUANTITY,
						PROPS: itemData.PROPS_ALL,
						SORT: itemData.SORT,
						MODULE: itemData.MODULE,
						PRODUCT_PROVIDER_CLASS: itemData.PRODUCT_PROVIDER_CLASS
					});

					this.items[itemData.ID].SHOW_RESTORE = false;
					this.items[itemData.ID].SHOW_LOADING = true;
					this.redrawBasketItemNode(itemData.ID);
				}, this)
			);
			BX.bind(
				this.getEntity(node, 'basket-item-close-restore-button'),
				'click',
				BX.delegate(function() {
					this.deleteBasketItem(itemData.ID, false, true);
				}, this)
			);
		},

		bindItemWarningEvents: function(node, data)
		{
			if (!node || !data)
				return;

			BX.bind(
				this.getEntity(BX(this.ids.item + data.ID), 'basket-item-warning-close'),
				'click',
				BX.proxy(this.closeItemWarnings, this)
			);
		},

		closeItemWarnings: function()
		{
			var target = BX.proxy_context;

			if (BX.type.isDomNode(target))
			{
				var itemData = this.getItemDataByTarget(target);

				this.items[itemData.ID].WARNINGS = [];
				this.warningItems.splice(BX.util.array_search(itemData.ID, this.warningItems), 1);

				this.redrawBasketItemNode(itemData.ID);
				this.editWarnings();
			}
		},

		renderBasketItem: function(template, data)
		{
			var clonedData = BX.clone(data);

			if (BX.type.isPlainObject(clonedData))
			{
				clonedData.USE_FILTER = this.useItemsFilter
					&& !this.filter.currentFilter.similarHash.length;
			}

			return Mustache.render(template, clonedData);
		},

		render: function(template, data)
		{
			return Mustache.render(template, data);
		},

		checkAnalytics: function(data)
		{
			if (!data || !data.basket)
				return;

			var itemId, itemsDiff = {};

			for (var i in data.basket)
			{
				if (data.basket.hasOwnProperty(i) && i.indexOf('QUANTITY_') >= 0)
				{
					itemId = i.substr(9);

					if (this.items[itemId])
					{
						itemsDiff[itemId] = parseFloat(data.basket[i]) - parseFloat(BX(this.ids.quantity + itemId).getAttribute('data-value'));
					}
				}
			}

			this.setAnalyticsDataLayer(itemsDiff);
		},

		setAnalyticsDataLayer: function(itemsDiff)
		{
			if (!itemsDiff || Object.keys(itemsDiff).length === 0)
				return;

			window[this.params.DATA_LAYER_NAME] = window[this.params.DATA_LAYER_NAME] || [];

			var plus = [], minus = [];

			for (var itemId in itemsDiff)
			{
				if (itemsDiff.hasOwnProperty(itemId))
				{
					if (itemsDiff[itemId] > 0)
					{
						plus.push(this.getItemAnalyticsInfo(itemId, itemsDiff[itemId]));
					}
					else if (itemsDiff[itemId] < 0)
					{
						minus.push(this.getItemAnalyticsInfo(itemId, itemsDiff[itemId]));
					}
				}
			}

			if (plus.length)
			{
				window[this.params.DATA_LAYER_NAME].push({
					event: 'addToCart',
					ecommerce: {
						currencyCode: this.items[itemId].CURRENCY || '',
						add: {
							products: plus
						}
					}
				});
			}

			if (minus.length)
			{
				window[this.params.DATA_LAYER_NAME].push({
					event: 'removeFromCart',
					ecommerce: {
						currencyCode: this.items[itemId].CURRENCY || '',
						remove: {
							products: minus
						}
					}
				});
			}
		},

		getItemAnalyticsInfo: function(itemId, diff)
		{
			if (!this.items[itemId])
				return {};

			var brand = (this.items[itemId].BRAND || '').split(',  ').join('/');
			var variants = [];

			var selectedSku = this.getEntities(BX(this.ids.item + itemId), 'basket-item-sku-field', '.selected');
			for (var i = 0, l = selectedSku.length; i < l; i++)
			{
				variants.push(selectedSku[i].getAttribute('data-sku-name'));
			}

			return {
				'name': this.items[itemId].NAME || '',
				'id': this.items[itemId].ID || '',
				'price': this.items[itemId].PRICE || 0,
				'brand': brand,
				'variant': variants.join('/'),
				'quantity': Math.abs(diff)
			};
		}
	};
})();
/* End */
;; /* /local/templates/shop/components/bitrix/sale.basket.basket/.default/script.js?154445784238253*/
; /* /local/templates/shop/components/bitrix/sale.basket.basket/.default/js/mustache.js?154204184919670*/
; /* /local/templates/shop/components/bitrix/sale.basket.basket/.default/js/action-pool.js?15420418495918*/
; /* /local/templates/shop/components/bitrix/sale.basket.basket/.default/js/filter.js?154204184913835*/
; /* /local/templates/shop/components/bitrix/sale.basket.basket/.default/js/component.js?154816734663921*/
