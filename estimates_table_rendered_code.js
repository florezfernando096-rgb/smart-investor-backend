
        /* DCF section end */

        /* Estimates section start */

        let start_year = 2018
        if (estimates['first_estimate_year'] != undefined){
            start_year = parseInt(estimates['first_estimate_year']) - 5
        }

        $("#estimates_table").append("<th><h3>Year</h3></th>");
        $("#dcf_table").append("<th><h3>Year</h3></th>");

        for (let i = 0; i < 10; i++) {
            if (i > 4) {
                $("#estimates_table").append('<th style="width: 8.3%"><h3>' + start_year + 'E</h3></th>');
                $("#dcf_table").append('<th style="width: 8.3%"><h3>' + start_year + 'E</h3></th>');
            } else {
                $("#estimates_table").append('<th style="width: 8.3%"><h3>' + start_year + '</h3></th>');
                $("#dcf_table").append('<th style="width: 8.3%"><h3>' + start_year + '</h3></th>');
            }
            start_year = start_year + 1
        }

        $("#estimates_table").append('<th style="width: 8.3%"><h3>Growth</h3></th>');

        // Create array with previous and estimates revenues ---------------------------------------------------

        if (company_profile[0]['isEtf'] == false) {

            var estimates_rev_percentage_array = [];

            for (let i = 4; i >= 0; i--) {

                if (income_statement_growth[i] == undefined || income_statement_growth[i]['growthRevenue'] == undefined) {
                    estimates_rev_percentage_array.push(0);
                } else {
                    estimates_rev_percentage_array.push(income_statement_growth[i]['growthRevenue']);
                }

            }

            let rev_next_5_years_percentage = 0;

            for (let i = 5; i < estimates_rev_array.length; i++) {
                if (estimates_rev_array[i - 1] == 0) {
                    estimates_rev_percentage_array.push('-');
                }
                else {
                    if (estimates_rev_array[i] > 0 && estimates_rev_array[i - 1] > 0) {
                        estimates_rev_percentage_array.push((estimates_rev_array[i] - estimates_rev_array[i - 1]) / estimates_rev_array[i - 1]);
                        rev_next_5_years_percentage += parseFloat((estimates_rev_array[i] - estimates_rev_array[i - 1]) / estimates_rev_array[i - 1]);
                    } else {
                        estimates_rev_percentage_array.push(((estimates_rev_array[i] - estimates_rev_array[i - 1]) / estimates_rev_array[i - 1]) * -1);
                        rev_next_5_years_percentage += parseFloat(((estimates_rev_array[i] - estimates_rev_array[i - 1]) / estimates_rev_array[i - 1]) * -1);
                    }
                }
            }

            // Create array with previous and estimates net income -----------------------------------------------------

            estimates_net_income = []
            if (estimates['estimates_net_income'] != undefined) {
                estimates_net_income = estimates['estimates_net_income']
            }

            estimates_net_income_array = []
            for (let i = 4; i >= 0; i--) {

                if (full_income_statement[i] == undefined) {
                    estimates_net_income_array.push(0);
                } else {
                    estimates_net_income_array.push((full_income_statement[i]['netIncome'] / 1000000).toFixed(0));
                }

            }

            for (let i = 0; i < estimates_net_income.length; i++) {

                if (estimates_net_income[i] == undefined) {
                    estimates_net_income_array.push(0);
                } else {
                    estimates_net_income_array.push(parseInt(estimates_net_income[i]));
                }

            }

            estimates_net_income_percetage_array = []

            for (let i = 4; i >= 0; i--) {

                if (income_statement_growth[i] == undefined) {
                    estimates_net_income_percetage_array.push(0);
                } else {
                    estimates_net_income_percetage_array.push(income_statement_growth[i]['growthNetIncome']);
                }

            }

            let net_income_next_5_years_percentage = 0;

            for (let i = 5; i < estimates_net_income_array.length; i++) {

                let estimates_net_income_array_temp = (estimates_net_income_array[i] - estimates_net_income_array[i - 1]) / estimates_net_income_array[i - 1];

                if (estimates_net_income_array[i - 1] == 0) {
                    estimates_net_income_array_temp = '-';
                }
                else {

                    if (estimates_net_income_array[i] > 0 && estimates_net_income_array[i - 1] > 0) {
                        estimates_net_income_array_temp = estimates_net_income_array_temp;
                    } else if (estimates_net_income_array[i] < 0 && estimates_net_income_array[i - 1] < 0) {
                        if (estimates_net_income_array[i] > estimates_net_income_array[i - 1] && estimates_net_income_array_temp < 0) {
                            estimates_net_income_array_temp = estimates_net_income_array_temp * -1
                        } else if (estimates_net_income_array[i] < estimates_net_income_array[i - 1] && estimates_net_income_array_temp > 0) {
                            estimates_net_income_array_temp = estimates_net_income_array_temp * -1
                        }
                    } else if (estimates_net_income_array[i] > 0 && estimates_net_income_array[i - 1] < 0 && estimates_net_income_array_temp < 0) {
                        estimates_net_income_array_temp = estimates_net_income_array_temp * -1
                    } else {
                        if (estimates_net_income_array[i] < estimates_net_income_array[i - 1] && estimates_net_income_array_temp > 0) {
                            estimates_net_income_array_temp = estimates_net_income_array_temp * -1
                        }
                    }

                    net_income_next_5_years_percentage += estimates_net_income_array_temp;
                }

                estimates_net_income_percetage_array.push(estimates_net_income_array_temp);
            }

            // Create array with previous and estimates EPS ----------------------------------------------------------------

            estimates_eps = []
            if (estimates['estimates_eps'] != undefined) {
                estimates_eps = estimates['estimates_eps']
            }

            estimates_eps_array = []
            for (let i = 4; i >= 0; i--) {

                if (full_income_statement[i] == undefined) {
                    estimates_eps_array.push(0);
                } else {
                    estimates_eps_array.push(full_income_statement[i]['eps']);
                }

            }

            for (let i = 0; i < estimates_eps.length; i++) {

                if (estimates_eps[i] == undefined) {
                    estimates_eps_array.push(0);
                } else {
                    estimates_eps_array.push(parseFloat(estimates_eps[i]));
                }

            }

            estimates_eps_percetage_array = [];

            for (let i = 4; i >= 0; i--) {

                if (income_statement_growth[i] == undefined) {
                    estimates_eps_percetage_array.push(0);
                } else {
                    estimates_eps_percetage_array.push(income_statement_growth[i]['growthEPS']);
                }

            }

            let eps_next_5_years_percentage = 0;

            for (let i = 5; i < estimates_eps_array.length; i++) {

                let estimates_eps_array_temp = (estimates_eps_array[i] - estimates_eps_array[i - 1]) / estimates_eps_array[i - 1];

                if (estimates_eps_array[i - 1] == 0) {
                    estimates_eps_array_temp = '-';
                }
                else {

                    if (estimates_eps_array[i] > 0 && estimates_eps_array[i - 1] > 0) {
                        estimates_eps_array_temp = estimates_eps_array_temp;
                    } else if (estimates_eps_array[i] < 0 && estimates_eps_array[i - 1] < 0) {
                        if (estimates_eps_array[i] > estimates_eps_array[i - 1] && estimates_eps_array_temp < 0) {
                            estimates_eps_array_temp = estimates_eps_array_temp * -1
                        } else if (estimates_eps_array[i] < estimates_eps_array[i - 1] && estimates_eps_array_temp > 0) {
                            estimates_eps_array_temp = estimates_eps_array_temp * -1
                        }
                    } else if (estimates_eps_array[i] > 0 && estimates_eps_array[i - 1] < 0 && estimates_eps_array_temp < 0) {
                        estimates_eps_array_temp = estimates_eps_array_temp * -1
                    } else {
                        if (estimates_eps_array[i] < estimates_eps_array[i - 1] && estimates_eps_array_temp > 0) {
                            estimates_eps_array_temp = estimates_eps_array_temp * -1
                        }
                    }
    
                    eps_next_5_years_percentage += estimates_eps_array_temp

                }

                estimates_eps_percetage_array.push(estimates_eps_array_temp);

            }

            if (eps_next_5_years_percentage >= 0) {
                $('#estimate_growth_next_5_years').addClass('text-navy');
            } else {
                $('#estimate_growth_next_5_years').addClass('text-danger');
            }

            $('#estimate_growth_next_5_years').html(((eps_next_5_years_percentage) / 5 * 100).toFixed(2) + '%');

            // Create array with previous and estimates FCF ----------------------------------------------------------------

            var estimates_fcf_percentage_array = [];

            for (let i = 4; i >= 0; i--) {

                if (financial_growth[i] == undefined || financial_growth[i]['freeCashFlowGrowth'] == undefined) {
                    estimates_fcf_percentage_array.push(0);
                } else {
                    estimates_fcf_percentage_array.push(financial_growth[i]['freeCashFlowGrowth']);
                }

            }

            let dcf_next_5_years_percentage = 0;

            for (let i = 5; i < dcf_free_cash_flow.length; i++) {

                let estimates_fcf_percentage_array_temp = (dcf_free_cash_flow[i] - dcf_free_cash_flow[i - 1]) / dcf_free_cash_flow[i - 1];

                if (dcf_free_cash_flow[i - 1] == 0){
                    estimates_fcf_percentage_array_temp = '-';
                }
                else {

                    if (dcf_free_cash_flow[i] > 0 && dcf_free_cash_flow[i - 1] > 0) {
                        estimates_fcf_percentage_array_temp = estimates_fcf_percentage_array_temp;
                    } else if (dcf_free_cash_flow[i] < 0 && dcf_free_cash_flow[i - 1] < 0) {
                        if (dcf_free_cash_flow[i] > dcf_free_cash_flow[i - 1] && estimates_fcf_percentage_array_temp < 0) {
                            estimates_fcf_percentage_array_temp = estimates_fcf_percentage_array_temp * -1
                        } else if (dcf_free_cash_flow[i] < dcf_free_cash_flow[i - 1] && estimates_fcf_percentage_array_temp > 0) {
                            estimates_fcf_percentage_array_temp = estimates_fcf_percentage_array_temp * -1
                        }
                    } else if (dcf_free_cash_flow[i] > 0 && dcf_free_cash_flow[i - 1] < 0 && estimates_fcf_percentage_array_temp < 0) {
                        estimates_fcf_percentage_array_temp = estimates_fcf_percentage_array_temp * -1
                    } else {
                        if (dcf_free_cash_flow[i] < dcf_free_cash_flow[i - 1] && estimates_fcf_percentage_array_temp > 0 || (dcf_free_cash_flow[i] > dcf_free_cash_flow[i - 1] && estimates_fcf_percentage_array_temp < 0)) {
                            estimates_fcf_percentage_array_temp = estimates_fcf_percentage_array_temp * -1
                        }
                    }
    
                    dcf_next_5_years_percentage += estimates_fcf_percentage_array_temp;
                }

                estimates_fcf_percentage_array.push(estimates_fcf_percentage_array_temp);
            }

            // Create array with previous and estimates EBITDA ----------------------------------------------------------------

            estimates_ebitda = []
            if (estimates['estimates_ebitda'] != undefined) {
                estimates_ebitda = estimates['estimates_ebitda']
            }

            estimates_ebitda_array = []
            for (let i = 4; i >= 0; i--) {

                if (full_income_statement[i] == undefined) {
                    estimates_ebitda_array.push(0);
                } else {
                    estimates_ebitda_array.push((full_income_statement[i]['ebitda']/1000000).toFixed(0));
                }

            }

            for (let i = 0; i < estimates_ebitda.length; i++) {

                if (estimates_ebitda[i] == undefined) {
                    estimates_ebitda_array.push(0);
                } else {
                    estimates_ebitda_array.push(parseInt(estimates_ebitda[i]));
                }

            }

            estimates_ebitda_percetage_array = [];

            for (let i = 4; i >= 0; i--) {

                if (income_statement_growth[i] == undefined) {
                    estimates_ebitda_percetage_array.push(0);
                } else {
                    estimates_ebitda_percetage_array.push(income_statement_growth[i]['growthEBITDA']);
                }

            }

            let ebitda_next_5_years_percentage = 0;

            for (let i = 5; i < estimates_ebitda_array.length; i++) {

                let estimates_ebitda_array_temp = (estimates_ebitda_array[i] - estimates_ebitda_array[i - 1]) / estimates_ebitda_array[i - 1];
                
                if (estimates_ebitda_array[i - 1] == 0) {
                    estimates_ebitda_array_temp = '-'
                }
                else {
                    if (estimates_ebitda_array[i] > 0 && estimates_ebitda_array[i - 1] > 0) {
                        estimates_ebitda_array_temp = estimates_ebitda_array_temp;
                    } else if (estimates_ebitda_array[i] < 0 && estimates_ebitda_array[i - 1] < 0) {
                        if (estimates_ebitda_array[i] > estimates_ebitda_array[i - 1] && estimates_ebitda_array_temp < 0) {
                            estimates_ebitda_array_temp = estimates_ebitda_array_temp * -1
                        } else if (estimates_ebitda_array[i] < estimates_ebitda_array[i - 1] && estimates_ebitda_array_temp > 0) {
                            estimates_ebitda_array_temp = estimates_ebitda_array_temp * -1
                        }
                    } else if (estimates_ebitda_array[i] > 0 && estimates_ebitda_array[i - 1] < 0 && estimates_ebitda_array_temp < 0) {
                        estimates_ebitda_array_temp = estimates_ebitda_array_temp * -1
                    } else {
                        if (estimates_ebitda_array[i] < estimates_ebitda_array[i - 1] && estimates_ebitda_array_temp > 0) {
                            estimates_ebitda_array_temp = estimates_ebitda_array_temp * -1
                        }
                    }

                    ebitda_next_5_years_percentage += estimates_ebitda_array_temp
                }

                estimates_ebitda_percetage_array.push(estimates_ebitda_array_temp);

            }

            $('#revenues_estimates_estimates_tbody').append('<td><h3>Revenues</h3></td>');
            $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5>% Change YoY</h5></td>');
            $('#net_income_estimates_tbody').append('<td><h3>Net Income</h3></td>');
            $('#net_income_estimates_percentage_tbody').append('<td><h5>% Change YoY</h5></td>');
            $('#eps_estimates_tbody').append('<td><h3>EPS</h3></td>');
            $('#eps_estimates_percentage_tbody').append('<td><h5>% Change YoY</h5></td>');
            $('#forward_pe').append('<td><h5>Forward PE</h5></td>');
            $('#free_cash_flow_estimates_tbody').append('<td><h3>Free Cash Flow</h3></td>');
            $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5>% Change YoY</h5></td>');
            $('#ebitda_estimates_tbody').append('<td><h3>Ebitda</h3></td>');
            $('#ebitda_estimates_percentage_tbody').append('<td><h5>% Change YoY</h5></td>');
            $('#dividend_estimates_tbody').append('<td><h3>Dividends</h3></td>');
            $('#dividend_estimates_percentage_tbody').append('<td><h5>% Change YoY</h5></td>');

            if (estimates_net_income_percetage_array.length < 10) {
                for (let i = (10 - estimates_rev_array.length); i > 0 ; i--) {
                    estimates_rev_array.push('-');
                    estimates_rev_percentage_array.push('-');
                }
            }

            for (let i = 0; i < 10; i++) {

                if(!estimates_rev_array[i]) {

                    $('#revenues_estimates_estimates_tbody').append('<td>-</td>');
                    $('#revenues_estimates_estimates_percentage_tbody').append('<td>-</td>');

                }
                else{

                    if (estimates_rev_array[i] == "-") {
                        $('#revenues_estimates_estimates_tbody').append('<td>-</td>');
                        $('#revenues_estimates_estimates_percentage_tbody').append('<td>-</td>');
                    }
                    else{

                        // Draw estimates revenues and revenues percentage in table
                        $('#revenues_estimates_estimates_tbody').append('<td><h3>' + parseFloat(estimates_rev_array[i]).toLocaleString('en-US') + '</h3></td>');

                        if (estimates_rev_percentage_array[i] == '-'){
                            $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5 class="text-navy">-</h5></td>');
                        }
                        else if (estimates_rev_percentage_array[i] > 0) {
                            $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + (estimates_rev_percentage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                        } else {
                            $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + (estimates_rev_percentage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                        }

                    }
                }

                if(!estimates_net_income_array[i]) {

                    $('#net_income_estimates_tbody').append('<td>-</td>');
                    $('#net_income_estimates_percentage_tbody').append('<td>-</td>');

                }
                else{

                    // Draw estimates net income and net income percentage in table
                    $('#net_income_estimates_tbody').append('<td><h3>' + parseFloat(estimates_net_income_array[i]).toLocaleString('en-US') + '</h3></td>');

                    if (estimates_net_income_percetage_array[i] == '-'){
                        $('#net_income_estimates_percentage_tbody').append('<td><h5 class="text-navy">-</h5></td>');
                    }
                    else if (estimates_net_income_percetage_array[i] > 0) {
                        $('#net_income_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + (estimates_net_income_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    } else {
                        $('#net_income_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + (estimates_net_income_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    }

                }

                if(!estimates_eps_array[i]){

                    $('#eps_estimates_tbody').append('<td>-</td>');
                    $('#eps_estimates_percentage_tbody').append('<td>-</td>');
                    $('#forward_pe').append('<td>-</td>');

                }
                else{

                    // Draw estimates EPS and EPS percentage in table
                    $('#eps_estimates_tbody').append('<td><h3>' + parseFloat(estimates_eps_array[i]).toLocaleString('en-US') + '</h3></td>');

                    if (estimates_eps_percetage_array[i] == '-'){
                        $('#eps_estimates_percentage_tbody').append('<td><h5 class="text-navy">-</h5></td>');
                    }
                    else if (estimates_eps_percetage_array[i] > 0) {
                        $('#eps_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + (estimates_eps_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    } else {
                        $('#eps_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + (estimates_eps_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    }

                    // Draw estimates Forward PE
                    if(i < 5){
                        $('#forward_pe').append('<td></td>');
                    }
                    else{
                        $('#forward_pe').append('<td><h5>' + (company_profile[0]['price']/estimates_eps_array[i]).toFixed(2) + '</h5></td>');
                    }

                }

                if(!dcf_free_cash_flow[i]){

                    $('#free_cash_flow_estimates_tbody').append('<td>-</td>');
                    $('#free_cash_flow_estimates_percentage_tbody').append('<td>-</td>');

                }
                else{

                    // Draw estimates FCF and FCF percentage in table

                    $('#free_cash_flow_estimates_tbody').append('<td><h3>' + parseFloat(dcf_free_cash_flow[i]).toLocaleString('en-US') + '</h3></td>');

                    if (estimates_fcf_percentage_array[i] == '-'){
                        $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5 class="text-navy">-</h5></td>');
                    }
                    else if (estimates_fcf_percentage_array[i] > 0) {
                        $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + (estimates_fcf_percentage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    } else {
                        $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + (estimates_fcf_percentage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    }

                }

                if(!estimates_ebitda_array[i]) {

                    $('#ebitda_estimates_tbody').append('<td>-</td>');
                    $('#ebitda_estimates_percentage_tbody').append('<td>-</td>');

                }
                else{

                    // Draw estimates net income and net income percentage in table
                    $('#ebitda_estimates_tbody').append('<td><h3>' + parseFloat(estimates_ebitda_array[i]).toLocaleString('en-US') + '</h3></td>');

                    if (estimates_ebitda_percetage_array[i] == '-'){
                        $('#ebitda_estimates_percentage_tbody').append('<td><h5 class="text-navy">-</h5></td>');
                    }
                    else if (estimates_ebitda_percetage_array[i] > 0) {
                        $('#ebitda_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + (estimates_ebitda_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    } else {
                        $('#ebitda_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + (estimates_ebitda_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                    }

                }

            }

            if (estimates_rev.length > 0) {
                $('#revenues_estimates_estimates_tbody').append('<td></td>');
                if(rev_next_5_years_percentage > 0){
                    $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + ((rev_next_5_years_percentage/estimates_rev.length)*100).toFixed(2) + '%</h5></td>');
                }
                else {
                    $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + ((rev_next_5_years_percentage/estimates_rev.length)*100).toFixed(2) + '%</h5></td>');
                }
            }
            else {
                $('#revenues_estimates_estimates_percentage_tbody').append('<td><h5>-</h5></td>');
            }

            if (estimates_net_income.length > 0) {
                $('#net_income_estimates_tbody').append('<td></td>');
                if(net_income_next_5_years_percentage > 0){
                    $('#net_income_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + ((net_income_next_5_years_percentage/estimates_net_income.length)*100).toFixed(2) + '%</h5></td>');
                }
                else {
                    $('#net_income_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + ((net_income_next_5_years_percentage/estimates_net_income.length)*100).toFixed(2) + '%</h5></td>');
                }
            }
            else {
                $('#net_income_estimates_percentage_tbody').append('<td><h5>-</h5></td>');
            }

            if (estimates_eps.length > 0) {
                $('#eps_estimates_tbody').append('<td></td>');
                $('#forward_pe').append('<td></td>');
                if(eps_next_5_years_percentage > 0){
                    $('#eps_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + ((eps_next_5_years_percentage/estimates_eps.length)*100).toFixed(2) + '%</h5></td>');
                }
                else {
                    $('#eps_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + ((eps_next_5_years_percentage/estimates_eps.length)*100).toFixed(2) + '%</h5></td>');
                }
            }
            else {
                $('#eps_estimates_percentage_tbody').append('<td><h5>-</h5></td>');
            }

            if (estimates_fcf.length > 0) {
                $('#free_cash_flow_estimates_tbody').append('<td></td>');
                if (dcf_next_5_years_percentage > 0) {
                    $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + ((dcf_next_5_years_percentage / estimates_fcf.length) * 100).toFixed(2) + '%</h5></td>');
                } else {
                    $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + ((dcf_next_5_years_percentage / estimates_fcf.length) * 100).toFixed(2) + '%</h5></td>');
                }
            }
            else {
                $('#free_cash_flow_estimates_percentage_tbody').append('<td><h5>-</h5></td>');
            }

            if (estimates_ebitda.length > 0) {
                $('#ebitda_estimates_tbody').append('<td></td>');
                if(ebitda_next_5_years_percentage > 0){
                    $('#ebitda_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + ((ebitda_next_5_years_percentage/estimates_ebitda.length)*100).toFixed(2) + '%</h5></td>');
                }
                else {
                    $('#ebitda_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + ((ebitda_next_5_years_percentage/estimates_ebitda.length)*100).toFixed(2) + '%</h5></td>');
                }
            }
            else {
                $('#ebitda_estimates_percentage_tbody').append('<td><h5>-</h5></td>');
            }

        }

        /* Estimates section end */

        /* Stock chart section start */

        $(document).on('click', '.stock_chart', function () {

            let time_period = $(this).attr('id');

            if (!$(this).hasClass('active')) {

                $('.stock_chart').removeClass('active');
                $(this).addClass('active');

                $('#ibox_stock_chart').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "historical_price",
                    data: {symbol: stock, time_period: time_period},
                    success: function (data) {

                        var chart_type = localStorage.getItem('chart_type') ? localStorage.getItem('chart_type') : "candlestick";

                        let price = data.price;
                        if (chart_type == "candlestick"){

                            for(var i = 0; i < price.length; i++)
                            {   
                                var date_us = new Date(price[i]['label']); 
                                price[i]['label'] = date_us.toLocaleString('en-US', { timeZone: 'UTC' });
                            } 

                        }
                        else {

                            var new_price = []
                            for(var i = 0; i < price.length; i++)
                            {
                                temp = {};
                                var date_us = new Date(price[i]['label']); 
                                //temp['x'] = date_us.toLocaleString('en-US', { timeZone: 'UTC' });
                                temp['x'] = new Date(price[i]['label']); 
                                temp['y'] = price[i]['y'][3];
                                new_price.push(temp);
                            } 
                            price = new_price;

                        }

                        var interval = 100;
                        if (time_period == '20years') {
                            interval = 200;
                        }
                        else if (time_period == '30years') {
                            interval = 300;
                        }
                        else if (time_period == '1year') {
                            interval = 10;
                        }

                        var chart_type = localStorage.getItem('chart_type') ? localStorage.getItem('chart_type') : "candlestick";

                        if (window.innerWidth < 1000) {
                            plot_stock_chart(price, interval*2, chart_type);
                        }
                        else {
                            plot_stock_chart(price, interval, chart_type);
                        }
                       
                        $("#performance").removeClass("text-navy text-danger");
                        if (data.performance > 0) {
                            $("#performance").addClass("text-navy");
                        }
                        else {
                            $("#performance").addClass("text-danger");
                        }
                        $("#performance").text("Performance: " + data.performance.toFixed(2) + "%");

                        $('#ibox_stock_chart').children('.ibox-content').toggleClass('sk-loading');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    }
                });

            }

        });

        $(document).on('click', '.chart_type', function () {

            let chart_type = $(this).attr('id');

            var time_period = $(".stock_chart.active").attr("id");

            if (!$(this).hasClass('active')) {

                localStorage.setItem('chart_type', chart_type);

                $('.chart_type').removeClass('active');
                $(this).addClass('active');

                $('#ibox_stock_chart').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "historical_price",
                    data: {symbol: stock, time_period: time_period},
                    success: function (data) {

                        let price = data.price;
                        if (chart_type == "candlestick"){

                            for(var i = 0; i < price.length; i++)
                            {   
                                var date_us = new Date(price[i]['label']); 
                                price[i]['label'] = date_us.toLocaleString('en-US', { timeZone: 'UTC' });
                            } 

                        }
                        else {

                            var new_price = []
                            for(var i = 0; i < price.length; i++)
                            {
                                temp = {};
                                var date_us = new Date(price[i]['label']); 
                                //temp['x'] = date_us.toLocaleString('en-US', { timeZone: 'UTC' });
                                temp['x'] = new Date(price[i]['label']); 
                                temp['y'] = price[i]['y'][3];
                                new_price.push(temp);
                            } 
                            price = new_price;

                        }

                        var interval = 100;
                        if (time_period == '20years') {
                            interval = 200;
                        }
                        else if (time_period == '30years') {
                            interval = 300;
                        }
                        else if (time_period == '1year') {
                            interval = 10;
                        }

                        if (window.innerWidth < 1000) {
                            plot_stock_chart(price, interval*2, chart_type);
                        }
                        else {
                            plot_stock_chart(price, interval, chart_type);
                        }
                       
                        $("#performance").removeClass("text-navy text-danger");
                        if (data.performance > 0) {
                            $("#performance").addClass("text-navy");
                        }
                        else {
                            $("#performance").addClass("text-danger");
                        }
                        $("#performance").text("Performance: " + data.performance.toFixed(2) + "%");

                        $('#ibox_stock_chart').children('.ibox-content').toggleClass('sk-loading');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    }
                });

            }

        });

        /* Stock chart section end */

        /* Income Statement section start */

        $(document).on('click', '.income_statement_table_time', function () {

            let limit = $(this).data('id');

            let period = $('.income_statement_table_period.active').data('id');

            if (!$(this).hasClass('active') && is_premium) {

                $('.income_statement_table_time').removeClass('active');
                $(this).addClass('active');

                $('#income_statement_table_ibox').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "income_statement",
                    data: { symbol: stock, limit: limit, period: period },
                    success: function (data) {
                        $("#income_statement_table").dataTable().fnDestroy();
                        $("#income_statement_table > thead").remove();
                        $("#income_statement_table > tbody").remove();
                        plotDataTable(data.data, data.years, 'income_statement_table');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    },
                    complete: function (data) {
                        $('#income_statement_table_ibox').children('.ibox-content').toggleClass('sk-loading');
                    },
                });

            }

        });

        $(document).on('click', '.income_statement_table_period', function () {

            let period = $(this).data('id');

            let limit = $('.income_statement_table_time.active').data('id');

            if (!$(this).hasClass('active') && is_premium) {

                $('.income_statement_table_time').each(function(i, obj) {
                    if (period == 'quarter') {
                        $(this).text($(this).data('id') + ' Quarters');
                    }
                    else{
                        $(this).text($(this).data('id') + ' Years');
                    }
                });

                $('.income_statement_table_period').removeClass('active');
                $(this).addClass('active');

                $('#income_statement_table_ibox').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "income_statement",
                    data: { symbol: stock, limit: limit, period: period },
                    success: function (data) {
                        $("#income_statement_table").dataTable().fnDestroy();
                        $("#income_statement_table > thead").remove();
                        $("#income_statement_table > tbody").remove();
                        plotDataTable(data.data, data.years, 'income_statement_table');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    },
                    complete: function (data) {
                        $('#income_statement_table_ibox').children('.ibox-content').toggleClass('sk-loading');
                    },
                });

            }

        });

        $(document).on('click', '.balance_sheet_table_time', function () {

            let limit = $(this).data('id');

            let period = $('.balance_sheet_table_period.active').data('id');

            if (!$(this).hasClass('active') && is_premium) {

                $('.balance_sheet_table_time').removeClass('active');
                $(this).addClass('active');

                $('#balance_sheet_table_ibox').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "balance_sheet",
                    data: { symbol: stock, limit: limit, period: period },
                    success: function (data) {
                        $("#balance_sheet_table").dataTable().fnDestroy();
                        $("#balance_sheet_table > thead").remove();
                        $("#balance_sheet_table > tbody").remove();
                        plotDataTable(data.data, data.years, 'balance_sheet_table');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    },
                    complete: function (data) {
                        $('#balance_sheet_table_ibox').children('.ibox-content').toggleClass('sk-loading');
                    },
                });

            }

        });

        $(document).on('click', '.balance_sheet_table_period', function () {

            let period = $(this).data('id');

            let limit = $('.balance_sheet_table_time.active').data('id');

            if (!$(this).hasClass('active') && is_premium) {

                $('.balance_sheet_table_time').each(function(i, obj) {
                    if (period == 'quarter') {
                        $(this).text($(this).data('id') + ' Quarters');
                    }
                    else{
                        $(this).text($(this).data('id') + ' Years');
                    }
                });

                $('.balance_sheet_table_period').removeClass('active');
                $(this).addClass('active');

                $('#income_statement_table_ibox').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "balance_sheet",
                    data: { symbol: stock, limit: limit, period: period },
                    success: function (data) {
                        $("#balance_sheet_table").dataTable().fnDestroy();
                        $("#balance_sheet_table > thead").remove();
                        $("#balance_sheet_table > tbody").remove();
                        plotDataTable(data.data, data.years, 'balance_sheet_table');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    },
                    complete: function (data) {
                        $('#income_statement_table_ibox').children('.ibox-content').toggleClass('sk-loading');
                    },
                });

            }

        });

        $(document).on('click', '.cash_flow_table_time', function () {

            let limit = $(this).data('id');

            let period = $('.cash_flow_table_period.active').data('id');

            if (!$(this).hasClass('active') && is_premium) {

                $('.cash_flow_table_time').removeClass('active');
                $(this).addClass('active');

                $('#cash_flow_table_ibox').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "cash_flow",
                    data: { symbol: stock, limit: limit, period: period },
                    success: function (data) {
                        $("#cash_flow_table").dataTable().fnDestroy();
                        $("#cash_flow_table > thead").remove();
                        $("#cash_flow_table > tbody").remove();
                        plotDataTable(data.data, data.years, 'cash_flow_table');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    },
                    complete: function (data) {
                        $('#cash_flow_table_ibox').children('.ibox-content').toggleClass('sk-loading');
                    },
                });

            }

        });

        $(document).on('click', '.cash_flow_table_period', function () {

            let period = $(this).data('id');

            let limit = $('.cash_flow_table_time.active').data('id');

            if (!$(this).hasClass('active') && is_premium) {

                $('.cash_flow_table_time').each(function(i, obj) {
                    if (period == 'quarter') {
                        $(this).text($(this).data('id') + ' Quarters');
                    }
                    else{
                        $(this).text($(this).data('id') + ' Years');
                    }
                });

                $('.cash_flow_table_period').removeClass('active');
                $(this).addClass('active');

                $('#cash_flow_table_ibox').children('.ibox-content').toggleClass('sk-loading');

                $.ajax({
                    url: "cash_flow",
                    data: { symbol: stock, limit: limit, period: period },
                    success: function (data) {
                        $("#cash_flow_table").dataTable().fnDestroy();
                        $("#cash_flow_table > thead").remove();
                        $("#cash_flow_table > tbody").remove();
                        plotDataTable(data.data, data.years, 'cash_flow_table');
                    },
                    error: function (data) {
                        $('#unknow_error').removeClass('hidden');
                    },
                    complete: function (data) {
                        $('#cash_flow_table_ibox').children('.ibox-content').toggleClass('sk-loading');
                    },
                });

            }

        });

        /* Income Statement section end */

        /* Follow button section start */

        let all_portfolios = [] 
        $(document).on('click', "#follow", function () {
            $('#portfolios_div').empty();
            $.ajax({
                url:"stock_in_portfolios",
                data: { symbol: stock, action: 'get' },
                dataType: "json",
                success: function(data) {
                    all_portfolios = data.all_portfolios;
                    for (portfolio of data.all_portfolios) {
                        $('#portfolios_div').append(`<div class="i-checks"><label> <input id="` + portfolio.id + `" type="checkbox" class="adding_to_portfolios" ` + (portfolio.has_stock ? 'checked': '') + ` > <i></i> ` + portfolio.name + ` </label></div>`);
                    }
                    $('.i-checks').iCheck({
                        checkboxClass: 'icheckbox_square-green',
                        radioClass: 'iradio_square-green',
                    });
                    $('#followingModal').modal('toggle');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

            /*
            let follow_status = $(this).data("id")

            if (follow_status == 'follow') {
                $('#follow').data('id', 'unfollow');
                $("#follow").html('<i style="color: #e9ca26" class="fa fa-heart"></i> Following');
            }
            else{
                $('#follow').data('id','follow');
                $("#follow").html('<i style="color: #ffffff" class="fa fa-heart"></i> Follow');
            }

            $('.stock_chart').removeClass('active');
            $(this).addClass('active');

            $.ajax({
                url:"holdings/stock_annotation",
                data: {symbol: stock, follow: follow_status.toLowerCase() === "follow"},
                type: "POST",
                dataType: "json",
                headers: { "X-CSRFToken": 'UAEYu6o9UYs2FAbuI4Sn9mHOP0xifbyqIRewoDiu9YYFy59RmIFDoyhjxrgqLUVc' },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })
        */
        });

        $(document).on('click', "#save_following", function () {
            
            all_portfolios_dict = {};
            for (item in all_portfolios) {
                all_portfolios_dict[all_portfolios[item].id] = all_portfolios[item].has_stock;
            }

            var inputs = $('.adding_to_portfolios');
            let modifications = [];
            $(".adding_to_portfolios").each(function() {

                if ($(this).is(':checked') != all_portfolios_dict[$(this).attr('id')]) {
                    let temp = {}
                    temp['id'] = $(this).attr('id');
                    temp['action'] = $(this).is(':checked');
                    modifications.push(temp);
                }

            });

            modify_followed_stocks = 'None';
            if (followed_stocks.follow != $('#watchlist').is(':checked')){
                modify_followed_stocks = $('#watchlist').is(':checked');
                followed_stocks.follow = $('#watchlist').is(':checked');
            }

            if ($('#watchlist').is(':checked') || $(".adding_to_portfolios:checked").length > 0) {
                $('#follow').data('id', 'unfollow');
                $("#follow").html('<i style="color: #e9ca26" class="fa fa-heart"></i> Following');
            }
            else{
                $('#follow').data('id','follow');
                $("#follow").html('<i style="color: #ffffff" class="fa fa-heart"></i> Follow');
            }
            $.ajax({
                url:"stock_in_portfolios",
                data: { symbol: stock, action: 'save', modifications: JSON.stringify(modifications), modify_followed_stocks: modify_followed_stocks },
                dataType: "json",
                success: function(data) {
                    toastr.success('Symbols added');
                    $('#followingModal').modal('toggle');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        $(document).on('click', "#save_stock_note, #delete_stock_note", function () {

            let action = $(this).attr('id');
            let data = {symbol: stock, note: $('#stock_note_div').val(), action: 'stock_note' };
            if ($(this).attr('id') == 'delete_stock_note') {
                data = {symbol: stock, action: 'stock_note' };
            }

            $.ajax({
                url:"holdings/stock_annotation",
                data: data,
                type: "POST",
                dataType: "json",
                headers: { "X-CSRFToken": 'UAEYu6o9UYs2FAbuI4Sn9mHOP0xifbyqIRewoDiu9YYFy59RmIFDoyhjxrgqLUVc' },
                success: function(response) {
                    $('#stock_notes_text').html($('#stock_note_div').val());
                    if (action == 'delete_stock_note'){
                        $('#add_stock_note_button').removeClass("hidden");
                        $('#technical_indicators_div').switchClass('col-lg-2', 'col-lg-4');
                        $('#stock_notes_div').addClass('hidden');
                        $('#stock_note_div').val('');
                        followed_stocks.note = None;
                        swal({
                            title: "Stock Note deleted",
                            type: "success"
                        });
                    }
                    else {
                        if (followed_stocks.note) {
                            swal({
                                title: "Stock Note updated",
                                type: "success"
                            });
                        }
                        else {
                            $('#add_stock_note_button').addClass("hidden");
                            if (fair_value_data['dcf_fair_value'] > 0 && fair_value_data['eps_fair_value']) {
                                $('#technical_indicators_div').switchClass('col-lg-4', 'col-lg-2');
                            }
                            $('#stock_notes_div').removeClass('hidden');
                            followed_stocks.note = $('#stock_note_div').val();
                            swal({
                                title: "Stock Note created",
                                type: "success"
                            });
                        }
                    }

                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

            $('#stockNotesModal').modal('toggle');

        });

        /* Follow button section end */

        /* Alarms section start */

        $("#price").on('ifChanged', function (e) {

            if ($('#price').prop("checked")){
                $("#alarm_value").text('Price');
            }
            else
            {
                $("#alarm_value").text('Value');
            }

        });

        $("#sma, #ema").on('ifChanged', function (e) {

            if ($('#sma').prop("checked") || $('#ema').prop("checked")){
                $("#time_frame_div").removeClass('hidden');
            }
            else
            {
                $("#time_frame_div").addClass('hidden');
            }

            if ($('#price').prop("checked")){
                $("#alarm_value").text('Price');
            }
            else
            {
                $("#alarm_value").text('Value');
            }

        });

        $(document).on('click', '#save_alarm', function () {

            let alarm_trend = 'below';
            if ($('#price_above').prop("checked")){
                alarm_trend = 'above';
            }

            var time_frame = $('#time_frame').val();

            let alert_source = "RSI"
            if ($("#price").prop("checked")){
                alert_source = "STOCK_PRICE"
            }
            else if ($("#sma").prop("checked")){
                alert_source = "SMA"
            }
            else if ($("#ema").prop("checked")){
                alert_source = "EMA"
            }

            if($('#alarm_price').val() == ''){
                $('#alarm_price').closest('div').addClass('has-error');
            }
            else{

                $.ajax({
                    url: "stock_alarms",
                    data: {stock: stock, action: 'create', alert_source: alert_source, alert_trend: alarm_trend, time_frame: time_frame, alert_value: $('#alarm_price').val().trim(), alert_notes: $('#alert_notes').val().trim()},
                    success: function (data) {
                        $('#alarmsModal').modal('toggle');
                        swal({
                            title: "Alert created",
                            type: "success"
                        });
                    },
                    error: function (data) {
                        const {title, message} = data.responseJSON
                        swal({
                            title: title || "Unexpected error",
                            type: "error",
                            text: message || "Please contact the administrator in this email admin@thesmartinvestortool.com."
                        });
                    },
                    complete: function (data) {
                        $('#alarm_price').val('');
                        $('#alert_notes').val('');
                        $('#alarm_price').closest('div').removeClass('has-error');
                        $("#alarms").html('<i style="color: #e9ca26" class="fa fa-bell"></i> Alerts');
                    }
                });

            }

        });

        $(document).on('click', '#alarms', function () {

            $.ajax({
                url: "stock_alarms",
                data: {stock: stock, action: 'get_alerts'},
                success: function (data) {
                    existing_alerts = data.response;
                    plot_alerts_table(data.response);
                }
            });

            $('#alarmsModal').modal('toggle');

        });
        
        let current_price = company_profile[0]['price'];
        $(document).on('click', '#calculate_cagr', function () {

            estimates_len = estimates['estimates_eps'].length;

            last_estimate_eps = estimates['estimates_eps'][estimates_len-1];

            let per = (parseFloat(ratios_history_filtered['priceEarningsRatio'])).toFixed(2)

            window.open('/cagr_calculator?current_price=' + current_price + '&dividend=' + (parseFloat(dividend)).toFixed(2) + 
                                                                            '&estimates_len=' + estimates_len + 
                                                                            '&per=' + per + 
                                                                            '&last_estimate_eps=' + last_estimate_eps, '_blank');

        });

        function plot_alerts_table(data) {

            $('#existing_alerts_body tr').remove();

            for (alert of data) {
                let alert_value =  alert.value ?  alert.value :  alert.period;
                let time_frame =  alert.time_frame ?  alert.time_frame :  '';
                $('#existing_alerts_body')
                    .append(
                        `<tr>
                            <td>${alert.trend}</td>
                            <td>${(alert.alert_source == 'STOCK_PRICE') ? 'Price' : alert.alert_source}</td>
                            <td>${(alert.alert_source == 'STOCK_PRICE') ? currency + alert_value : alert_value}</td>
                            <td>${time_frame}</td>
                            <td>${alert.notes}</td>
                            <td>${alert.created_at}</td>
                            <td>
                                <a class="delete_from_alerts m-l-md" data-id=${alert.id}>
                                    <i class="fa fa-trash text-danger"></i>
                                </a>
                                <a class="edit_from_alerts m-l-md" data-id=${alert.id} data-source=${alert.alert_source}>
                                    <i class="fa fa-edit text-primary"></i>
                                </a>
                            </td>
                        </tr>`);
            }

        }

        $(document).on('click', '.delete_from_alerts', function () {

            let alert_id = $(this).data('id');

            $(this).closest('tr').remove();

            $.ajax({
                url: "stock_alarms",
                data: {stock: stock, id: alert_id, action: 'delete_alert'},
                success: function (data) {
                    swal({
                        title: "Alert deleted",
                        type: "success"
                    });
                }
            });

        });

        $(document).on('click', '.edit_from_alerts', function () {

            let alert_id = $(this).data('id');
            let alert_source = $(this).data('source');

            for (let i = 0; i < existing_alerts.length; i++) {
                if (existing_alerts[i]['id'] == alert_id) {

                    let value = existing_alerts[i]['value'] ? existing_alerts[i]['value'] : existing_alerts[i]['period'];

                    if (existing_alerts[i]['alert_source'] == 'SMA' || existing_alerts[i]['alert_source'] == 'EMA') {
                        $('#div_edit_alert_time_frame').removeClass('hidden');
                    }
                    else {
                        $('#div_edit_alert_time_frame').addClass('hidden');
                    }
                    $('#edit_trend').val(existing_alerts[i]['trend']);
                    $('#edit_price').val(value);
                    $('#edit_notes').html(existing_alerts[i]['notes']);
                    $('#save_edit_alarm').data('id', alert_id);
                    $('#save_edit_alarm').data('source', alert_source);
                    $('#edit_alert_row').removeClass('hidden');
                    break;
                }
            }

        });

        $(document).on('click', '#save_edit_alarm', function () {

            $('#edit_alert_row').removeClass('hidden')

            let alert_id = $(this).data('id');
            let alert_source = $(this).data('source');
            let time_frame = $('#edit_time_frame').val();

            $.ajax({
                url: "stock_alarms",
                data: {page: 'metrics', stock: stock, id: alert_id, action: 'edit_alert', alert_source: alert_source, time_frame: time_frame, alert_trend: $('#edit_trend').val(), alert_value: $('#edit_price').val(), alert_notes: $('#edit_notes').html()},
                success: function (data) {
                    $('#edit_alert_row').addClass('hidden')
                    existing_alerts = data.response;
                    plot_alerts_table((data.response));
                    swal({
                        title: "Alert edited",
                        type: "success"
                    });
                }
            });

        });

        /* Alarms section end */

        /* Earnings section start */

        $("#price_alarms").on('ifChanged', function (e) {

            if (e.target.checked){
                $(".price_alarms_div").removeClass('hidden');
            }
            else
            {
                $(".price_alarms_div").addClass('hidden');
            }

        });

        let summary_en = null;
        let summary_es = null;
        let full_transcript = null;
        let quarter = null;
        let fiscalyear = null;

        $(document).on('click', '#view_earnings_transcript', function () {

            quarter = $(this).data('quarter');

            fiscalyear = $(this).data('fiscalyear');

            $.ajax({
                url: "get_earnings_transcript",
                data: { symbol: stock, quarter: quarter, fiscalyear: fiscalyear},
                success: function (data) {

                    $('#earning_call_transcript').html(data.earnings_transcript[0]['content'].replace(/\n/g, "<br>"));
                    full_transcript = data.earnings_transcript[0]['content'].replace(/\n/g, "<br>");
                    summary_en = data.summary_en;
                    summary_es = data.summary_es;

                    // Remove active style from all buttons
                    $(".btn_group_earnings")
                        .removeClass("btn-primary")
                        .addClass("btn-white");

                    // Add active style to clicked button
                    $('#full_Transcript')
                        .removeClass("btn-white")
                        .addClass("btn-primary");

                    $('#earningCallModal').modal('toggle');
                }
            });

        });

        let buttonId = null;

        $(".btn_group_earnings").on("click", function () {

            // Remove active style from all buttons
            $(".btn_group_earnings")
                .removeClass("btn-primary")
                .addClass("btn-white");

            // Add active style to clicked button
            $(this)
                .removeClass("btn-white")
                .addClass("btn-primary");

            // Get button ID
            buttonId = $(this).attr("id");

            if (summary_en == null && summary_es == null) {

                toastr.error('The summary is being generated. We will notify you when it is ready.');
                $('#spinner-call-transcript').removeClass('hidden');
                $("#earning_call_transcript").html('');
                startPolling()

            }
            else {

                // Handle content switching
                if (buttonId === "full_Transcript") {
                    $("#earning_call_transcript").html(full_transcript);
                }
                else if (buttonId === "summary_en") {
                    $("#earning_call_transcript").html(summary_en);
                }
                else if (buttonId === "summary_es") {
                    $("#earning_call_transcript").html(summary_es);
                }

            }

        });

        function fetchTranscriptData () {

            $.ajax({
                url: "get_earnings_transcript",
                data: { symbol: stock, quarter: quarter, fiscalyear: fiscalyear},
                success: function (data) {
                    full_transcript = data.earnings_transcript[0]['content'].replace(/\n/g, "<br>");
                    summary_en = data.summary_en;
                    summary_es = data.summary_es;
                }
            });

        }

        let pollingInterval = null;
        let attempts = 0;
        const maxAttempts = 10;

        function startPolling() {

            if (pollingInterval) return;

            pollingInterval = setInterval(async function () {

                await fetchTranscriptData();

                if (summary_en != null && summary_es != null) {
                    toastr.success('Summary is ready');
                    clearInterval(pollingInterval);  // ← was missing
                    pollingInterval = null;

                    $('#spinner-call-transcript').addClass('hidden');

                    if (buttonId === "summary_en") {
                        $("#earning_call_transcript").html(summary_en);
                    }
                    else if (buttonId === "summary_es") {
                        $("#earning_call_transcript").html(summary_es);
                    }
                    
                    return;
                }

                if (++attempts >= maxAttempts) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }

            }, 5000);

        }

        $(document).on('click', '#show_more_less_button', function () {

            let elements = $('.earnings-transcript-row.hidden');
            let count = 0;
            $(elements).each(function (index) {
                if (count < 5) {
                    $(this).removeClass('hidden');
                }
                else {
                    return false;
                }
                count++;
            });

        });

        /* Earnings section end */

        /* Fair Value Calculator EPS section start */

        function calculateIntrinsicValue(eps, growthRate, aaaBondYield) {
            // Ensure growthRate is in decimal form for calculation
            let g = growthRate;
            let intrinsicValue = eps * (8.5 + 2 * g) * 4.4 / aaaBondYield;
            return intrinsicValue;
        }

        function calculate_ddm_value(dividend, growth_rate, discount_rate) {
            value = dividend / (discount_rate - growth_rate)
            return value;
        }

        $("#current_year_eps, #expected_growth_rate, #treasury_bond").on('change paste keyup', function (e) {

            let current_year_eps = $('#current_year_eps').val();
            let expected_growth_rate = $('#expected_growth_rate').val();
            let treasury_bond = $('#treasury_bond').val();

            $("#save_eps_calculator").prop('disabled', false);

            let value = calculateIntrinsicValue(current_year_eps, expected_growth_rate, treasury_bond);

            let difference = ((value - company_profile[0]['price']) / company_profile[0]['price']) * 100

            $('#eps_fair_value').html(currency + value.toFixed(2));
            $('#fair_value_difference').html(difference.toFixed(2) + '%');

            if (difference >= 0){
                $('#fair_value_difference').removeClass('text-danger');
                $('#fair_value_difference').addClass('text-navy');
            }
            else {
                $('#fair_value_difference').removeClass('text-navy');
                $('#fair_value_difference').addClass('text-danger');
            }

        });

        $("#next_year_dividend, #expected_dividend_growth_rate, #required_return_ddm").on('change paste keyup', function (e) {

            var next_year_dividend_val = $('#next_year_dividend').val();
            var expected_dividend_growth_rate_val = $('#expected_dividend_growth_rate').val();
            var required_return_ddm_val = $('#required_return_ddm').val();

            $("#save_ddm_calculator").prop('disabled', false);

            let value = calculate_ddm_value(next_year_dividend_val, expected_dividend_growth_rate_val/100, required_return_ddm_val/100);

            let difference = ((value - company_profile[0]['price']) / company_profile[0]['price']) * 100

            $('#ddm_fair_value').html(currency + value.toFixed(2));
            $('#fair_value_difference_ddm').html(difference.toFixed(2) + '%');

            if (difference >= 0){
                $('#fair_value_difference_ddm').removeClass('text-danger');
                $('#fair_value_difference_ddm').addClass('text-navy');
            }
            else {
                $('#fair_value_difference_ddm').removeClass('text-navy');
                $('#fair_value_difference_ddm').addClass('text-danger');
            }

        });

        let eps_modified = {};
        $("#save_eps_calculator").on('click', function (e) {

            let eps_modified_input = $('#current_year_eps').val();
            if (parseFloat(eps_modified_input) != parseFloat(fair_value_data['EPS'])) {
                eps_modified['current_year_eps'] = eps_modified_input;
            }

            let expected_growth_rate = $('#expected_growth_rate').val();
            if (parseFloat(expected_growth_rate) != parseFloat(fair_value_data['g_80'])) {
                eps_modified['expected_growth_rate'] = expected_growth_rate;
            }

            let treasury_bond = $('#treasury_bond').val();
            if (parseFloat(treasury_bond) != parseFloat(fair_value_data['treasury_rates'])) {
                eps_modified['treasury_bond'] = treasury_bond;
            }

            $.ajax({
                url:"holdings/stock_fair_value",
                data: JSON.stringify({ eps_fair_value_data: eps_modified, symbol: stock }),
                type: "POST",
                dataType: "json",
                headers: { "X-CSRFToken": 'UAEYu6o9UYs2FAbuI4Sn9mHOP0xifbyqIRewoDiu9YYFy59RmIFDoyhjxrgqLUVc' },
                success: function(response) {
                    toastr.success('Estimates saved');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        $("#reset_eps_calculator").on('click', function (e) {

            $.ajax({
                url:"holdings/stock_fair_value",
                data: { action: 'reset_eps', symbol: stock },
                type: "GET",
                dataType: "json",
                success: function(response) {
                    toastr.success('Estimates reset');
                    $("#current_year_eps").val(fair_value_data['EPS']);
                    $("#expected_growth_rate").val(fair_value_data['g_80']);
                    $("#treasury_bond").val(fair_value_data['treasury_rates']);
                    $("#current_year_eps").trigger('change');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        let ddm_modified = {};
        $("#save_ddm_calculator").on('click', function (e) {

            let next_year_dividend_modified_input = $('#next_year_dividend').val();
            if (parseFloat(next_year_dividend_modified_input) != parseFloat(next_year_dividend_original_val)) {
                ddm_modified['next_year_dividend'] = next_year_dividend_modified_input;
            }

            let expected_dividend_growth_rate_modified_input = $('#expected_dividend_growth_rate').val();
            if (parseFloat(expected_dividend_growth_rate_modified_input) != parseFloat(expected_dividend_growth_rate_original_val)) {
                ddm_modified['expected_dividend_growth_rate'] = expected_dividend_growth_rate_modified_input;
            }

            let required_return_ddm_modified_input = $('#required_return_ddm').val();
            if (parseFloat(required_return_ddm_modified_input) != parseFloat(required_return_ddm_original_val)) {
                ddm_modified['required_return_ddm'] = required_return_ddm_modified_input;
            }

            $.ajax({
                url:"holdings/stock_fair_value",
                data: JSON.stringify({ ddm_fair_value_data: ddm_modified, symbol: stock }),
                type: "POST",
                dataType: "json",
                headers: { "X-CSRFToken": 'UAEYu6o9UYs2FAbuI4Sn9mHOP0xifbyqIRewoDiu9YYFy59RmIFDoyhjxrgqLUVc' },
                success: function(response) {
                    toastr.success('Estimates saved');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        $("#reset_ddm_calculator").on('click', function (e) {

            $.ajax({
                url:"holdings/stock_fair_value",
                data: { action: 'reset_ddm', symbol: stock },
                type: "GET",
                dataType: "json",
                success: function(response) {
                    toastr.success('Estimates reset');
                    $('#next_year_dividend').val(next_year_dividend_original_val);
                    $('#expected_dividend_growth_rate').val(expected_dividend_growth_rate_original_val);
                    $('#required_return_ddm').val(required_return_ddm_original_val);
                    $("#required_return_ddm").trigger('change');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        let dcf_modified = {};
        $("#save_dcf_calculator").on('click', function (e) {


            let perpetual_growth = $('#perpetual_growth').val();
            if (parseFloat(perpetual_growth) != 2.5) {
                dcf_modified['perpetual_growth'] = perpetual_growth;
            }

            let required_return = $('#required_return').val();
            if (parseFloat(required_return) != parseFloat(fair_value_data['discount_rate'])) {
                dcf_modified['required_return'] = required_return;
            }

            let dcf_shares_outstanding = $('#dcf_shares_outstanding').val();
            if (parseInt(dcf_shares_outstanding) != parseInt(fair_value_data['shares_outstanding'])) {
                dcf_modified['dcf_shares_outstanding'] = dcf_shares_outstanding;
            }

            let fcf_1 = $('#fcf_1').val();
            if (parseInt(fcf_1) != parseInt(fair_value_data['cash_flows'][0])) {
                dcf_modified['fcf_1'] = fcf_1;
            }

            let fcf_2 = $('#fcf_2').val();
            if (parseInt(fcf_2) != parseInt(fair_value_data['cash_flows'][1])) {
                dcf_modified['fcf_2'] = fcf_2;
            }

            let fcf_3 = $('#fcf_3').val();
            if (parseInt(fcf_3) != parseInt(fair_value_data['cash_flows'][2])) {
                dcf_modified['fcf_3'] = fcf_3;
            }

            let fcf_4 = $('#fcf_4').val();
            if (parseInt(fcf_4) != parseInt(fair_value_data['cash_flows'][3])) {
                dcf_modified['fcf_4'] = fcf_4;
            }

            let fcf_5 = $('#fcf_5').val();
            if (parseInt(fcf_5) != parseInt(fair_value_data['cash_flows'][4])) {
                dcf_modified['fcf_5'] = fcf_5;
            }

            $.ajax({
                url:"holdings/stock_fair_value",
                data: JSON.stringify({ dcf_fair_value_data: dcf_modified, symbol: stock }),
                type: "POST",
                dataType: "json",
                headers: { "X-CSRFToken": 'UAEYu6o9UYs2FAbuI4Sn9mHOP0xifbyqIRewoDiu9YYFy59RmIFDoyhjxrgqLUVc' },
                success: function(response) {
                    toastr.success('Estimates saved');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        $("#reset_dcf_calculator").on('click', function (e) {

            $.ajax({
                url:"holdings/stock_fair_value",
                data: { action: 'reset_dcf', symbol: stock },
                type: "GET",
                dataType: "json",
                success: function(response) {
                    toastr.success('Estimates reset');
                    $("#perpetual_growth").val(2.5);
                    $("#required_return").val(fair_value_data['discount_rate']);
                    $("#dcf_shares_outstanding").val(fair_value_data['shares_outstanding']);
                    $("#fcf_1").val(fair_value_data['cash_flows'][0]);
                    $("#fcf_2").val(fair_value_data['cash_flows'][1]);
                    $("#fcf_3").val(fair_value_data['cash_flows'][2]);
                    $("#fcf_4").val(fair_value_data['cash_flows'][3]);
                    $("#fcf_5").val(fair_value_data['cash_flows'][4]);
                    $("#current_year_eps").trigger('change');
                },
                error: function (data) {
                    swal({
                        title: "Unexpected error",
                        type: "error",
                        text: "Please contact the administrator in this email admin@thesmartinvestortool.com."
                    });
                }
            })

        });

        /* Fair Value Calculator EPS section end */

        if (company_profile[0]['isFund'] == false) {

            function checker(url, symbol, years, period) {
                return new window.Promise(function (resolve, reject) {

                    function successCallback(response) {
                        resolve(response);
                    }

                    function errorCallback(response) {
                        reject(response);
                    }

                    $.ajax({
                        dataType: 'JSON',
                        type: 'GET',
                        url: url,
                        data: {symbol: symbol, limit: years, period: period }
                    })
                        .done(successCallback)
                        .fail(errorCallback);
                });
            }
            /*
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            */
            function checkerSuccessTechnicalIndicators(response) {

                $('#adx').text(response['adx'].toFixed(2));
                if (response['adx'] >= 25) {
                    $('#adx').addClass('text-navy');
                } else {
                    $('#adx').addClass('text-danger');
                }

                $('#williams').text(response['williams'].toFixed(2));
                if (response['williams'] > -20 || response['williams'] < -80) {
                    $('#williams').addClass('text-danger');
                } else {
                    $('#williams').addClass('text-navy');
                }

                $('#rsi').text(response['rsi'].toFixed(2));
                $('#current_rsi').text(response['rsi'].toFixed(2));
                if (response['rsi'] > 70 || response['rsi'] < 30) {
                    $('#rsi').addClass('text-danger');
                    $('#current_rsi').addClass('text-danger');
                } else {
                    $('#rsi').addClass('text-navy');
                    $('#current_rsi').addClass('text-navy');
                }

                if (response['sma_200'] == '-'){
                    $('#sma200').text('-');
                }
                else {
                    let sma_diff = (company_profile[0]['price'] - response['sma_200']) / response['sma_200'];
                    $('#sma200').text((sma_diff * 100).toFixed(2) + '%');

                    if (sma_diff < 0) {
                        $('#sma200').addClass('text-danger');
                    } else {
                        $('#sma200').addClass('text-navy');
                    }
                }

                if (response['sma_50'] == '-'){
                    $('#sma50').text('-');
                }
                else {
                    let sma_diff = (company_profile[0]['price'] - response['sma_50']) / response['sma_50'];
                    $('#sma50').text((sma_diff * 100).toFixed(2) + '%');
                    if (sma_diff < 0) {
                        $('#sma50').addClass('text-danger');
                    } else {
                        $('#sma50').addClass('text-navy');
                    }
                }

                if (response['sma_20'] == '-'){
                    $('#sma20').text('-');
                }
                else {
                    let sma_diff = (company_profile[0]['price'] - response['sma_20']) / response['sma_20'];
                    $('#sma20').text((sma_diff * 100).toFixed(2) + '%');
                    if (sma_diff < 0) {
                        $('#sma20').addClass('text-danger');
                    } else {
                        $('#sma20').addClass('text-navy');
                    }
                }

            }

            function checkerSuccessEarnings(response) {

                if (response.earnings_chart_data.length > 0) {

                    $('#li_earnings').removeClass('hidden');

                    let last_report = response.last_report
                    let next_report = response.next_report

                    $('#latest_quarter_earnings').html("Latest Quarter's Earnings (" + last_report['date'] + ')');
                    $('#next_quarter_earnings').html("Next Quarter's Earnings (" + next_report['date'] + ')');

                    $('#eps_earning_reported').text(currency + last_report['eps']);
                    $('#eps_earning_estimate').text(currency + last_report['epsEstimated']);
                    if(last_report['eps'] > last_report['epsEstimated']){
                        $('#eps_earning_surprise').text('Beat by ' + currency + (last_report['eps'] - last_report['epsEstimated']).toFixed(2));
                        $('#eps_earning_surprise').addClass('text-navy');
                    }
                    else if(last_report['eps'] == last_report['epsEstimated']){
                        $('#eps_earning_surprise').text('In Line');
                    }
                    else{
                        $('#eps_earning_surprise').text('Miss by ' + currency + (last_report['eps'] - last_report['epsEstimated']).toFixed(2));
                        $('#eps_earning_surprise').addClass('text-danger');
                    }

                    $('#revenues_earning_reported').text(currency + last_report['revenueWithFormat']);
                    $('#revenues_earning_estimate').text(currency + last_report['revenueEstimatedWithFormat']);
                    if(last_report['revenue'] > last_report['revenueEstimated']){
                        $('#revenues_earning_surprise').text('Beat by ' + currency + last_report['revenueEstimatedDifference']);
                        $('#revenues_earning_surprise').addClass('text-navy');
                    }
                    else if(last_report['revenue'] == last_report['revenueEstimated']){
                        $('#revenues_earning_surprise').text('In Line');
                    }
                    else{
                        $('#revenues_earning_surprise').text('Miss by ' + currency + last_report['revenueEstimatedDifference']);
                        $('#revenues_earning_surprise').addClass('text-danger');
                    }

                    if (next_report['epsEstimated'] == null) {
                        $('#next_eps_earning_estimate').text('-');
                    }
                    else{
                        $('#next_eps_earning_estimate').text(currency + next_report['epsEstimated']);
                    }

                    if (next_report['revenueEstimated'] == null) {
                        $('#next_revenues_earning_estimate').text('-');
                    }
                    else{
                        $('#next_revenues_earning_estimate').text(currency + next_report['revenueWithFormat']);
                    }

                    Morris.Bar({
                        element: 'earnings-chart',
                        data: response.earnings_chart_data,
                        xkey: 'y',
                        ykeys: ['a', 'b'],
                        labels: ['Reported', 'Consensus'],
                        hideHover: 'auto',
                        resize: true,
                        barColors: ['#1ab394', '#cacaca'],
                        barColors: function (row, series, type) {
                                        let value = row.label.split(' ');
                                        value = parseFloat(value[1].replace("$/€", ""));
                                        if(series.label == "Reported" && value < 0) return "#c9392c";
                                        else if(series.label == "Reported") return "#1ab394";
                                        else if(series.label == "Consensus") return "#434348";
                                        else return "#434348";
                                    }
                    });

                    Morris.Bar({
                        element: 'earnings-revenues-chart',
                        data: response.earnings_chart_data_revenues,
                        xkey: 'y',
                        ykeys: ['a', 'b'],
                        labels: ['Reported', 'Consensus'],
                        hideHover: 'auto',
                        resize: true,
                        barColors: ['#1ab394', '#cacaca'],
                        barColors: function (row, series, type) {
                                        let value = row.label.split(' ');
                                        value = parseFloat(value[1].replace("$/€", ""));
                                        if(series.label == "Reported" && value < 0) return "#c9392c";
                                        if(series.label == "Reported") return "#1ab394";
                                        else if(series.label == "Consensus") return "#434348";
                                        else return "#434348";
                                    }
                    });

                    if (response.earnings_date_coming) {
                        $('#earnings-coming').removeClass('hidden');
                        
                        toastr.options = {
                            "closeButton": false,
                            "debug": false,
                            "newestOnTop": false,
                            "progressBar": false,
                            "positionClass": "toast-top-right",
                            "preventDuplicates": false,
                            "onclick": null,
                            "showDuration": "3000",
                            "hideDuration": "1000",
                            "timeOut": "10000",
                            "extendedTimeOut": "1000",
                            "showEasing": "swing",
                            "hideEasing": "linear",
                            "showMethod": "fadeIn",
                            "hideMethod": "fadeOut"
                        };

                        toastr["info"]("Earnings date for " + stock + " will be on " + response.next_report['date'], "Earnings date coming");
                    }
                }

                if (response.earning_transcript.length > 0) {

                    $('#earnings-transcript-div').removeClass('hidden');

                    $('#earnings-transcript-table-body').empty();

                    for (let i = 0; i < response.earning_transcript.length; i++) {
                        let transcript = response.earning_transcript[i];
                        let rowClass = i > 0 ? 'hidden' : '';
                        $('#earnings-transcript-table-body')
                            .append(
                                `<tr class="earnings-transcript-row ${rowClass}">
                                    <td>${transcript.fiscalYear}</td> 
                                    <td>${transcript.quarter}</td> 
                                    <td>${transcript.date}</td> 
                                    <td><a id="view_earnings_transcript" data-quarter="${transcript.quarter}" data-fiscalyear="${transcript.fiscalYear}">View Transcript</a></td>
                                </tr>`);
                    }

                }

            }

            function checkerSuccessAdditionalData(response) {

                if (response.revenue_product_segmentation.length > 0 || response.revenue_product_segmentation.constructor == Object) {

                    $('#li_additional_data').removeClass('hidden');
                    $('#div-geographic-segmentation').removeClass('hidden');

                    let revenue_product_segmentation = response.revenue_product_segmentation;
                    let revenue_product_segmentation_with_format = response.revenue_product_segmentation_with_format;
                    total = 0;
                    for (const [key, value] of Object.entries(revenue_product_segmentation)) {
                        total += value;
                    }

                    chart = [];
                    for (const [key, value] of Object.entries(revenue_product_segmentation)) {
                        chart.push({'label': key, 'value': ((value/total)*100).toFixed(2)});
                    }

                    Morris.Donut({
                        element: 'geographic-segmentation',
                        data: chart,
                        resize: true,
                        colors: ['#1ab394', '#23c6c8', '#f8ac59', '#ed5565', '#1c84c6', '#d1dade'],
                        formatter: function (value) { return (value) + '%'; }
                    });

                    for (const [key, value] of Object.entries(revenue_product_segmentation_with_format)) {
                        $('#geographic-segmentation-table')
                        .append(
                            `<tr>
                                <td>${key}</td>
                                <td>${value}</td>
                            </tr>`);
                    }
                }

                if (response.revenue_geographic_segmentation.length > 0 || response.revenue_geographic_segmentation.constructor == Object) {

                    $('#li_additional_data').removeClass('hidden');
                    $('#div-product-segmentation').removeClass('hidden');

                    let revenue_geographic_segmentation = response.revenue_geographic_segmentation;
                    let revenue_geographic_segmentation_with_format = response.revenue_geographic_segmentation_with_format;

                    total = 0;
                    for (const [key, value] of Object.entries(revenue_geographic_segmentation)) {
                        total += value;
                    }

                    chart = [];
                    for (const [key, value] of Object.entries(revenue_geographic_segmentation)) {
                        chart.push({'label': key, 'value': ((value/total)*100).toFixed(2)});
                    }

                    Morris.Donut({
                        element: 'product-segmentation',
                        data: chart,
                        resize: true,
                        colors: ['#1c84c6', '#1ab394', '#23c6c8', '#d1dade', '#f8ac59','#ed5565'],
                        formatter: function (value) { return (value) + '%'; }
                    });

                    for (const [key, value] of Object.entries(revenue_geographic_segmentation_with_format)) {
                        $('#product-segmentation-table')
                        .append(
                            `<tr>
                                <td>${key}</td>
                                <td>${value}</td>
                            </tr>`);
                    }

                }

            }

            function checkerInsiders(response) {

                if (response.insider_trading.length > 0) {

                    $('#li_insiders').removeClass('hidden');
                    $('#div-insider-trading').removeClass('hidden');

                    let insider_trading = response.insider_trading;

                    $("#insider-trading-table").dataTable().fnDestroy();
                    $('#insider-trading-table').DataTable({
                        data: insider_trading,
                        pageLength: 50,
                        lengthMenu: [10, 25, 50, 100, 500],
                        responsive: true,
                        order: false,
                        buttons: [
                            { extend: 'copy', title: 'insider-trading'},
                            {extend: 'csv', title: 'insider-trading'},
                            {extend: 'excel', title: 'insider-trading'},
                            {extend: 'pdf', title: 'insider-trading'},
            
                            {extend: 'print',
                             customize: function (win){
                                    $(win.document.body).addClass('white-bg');
                                    $(win.document.body).css('font-size', '10px');
            
                                    $(win.document.body).find('table')
                                            .addClass('compact')
                                            .css('font-size', 'inherit');
                            }
                            }
                        ],
                        'columnDefs': [ 
                            {
                                "render": function (data, type, row) {
                                    return data;
                                },
                                "width": "30%",
                                "targets": [0]
                            },
                            {
                                "render": function (data, type, row) {
                                    if (data == "Sale" || data == "Sale to Issuer" || data == "Sale Post-assigned")
                                    {
                                        return '<h4 class="text-danger" id=change_p_' + row[1] + '>' + data + '</h4>';
                                    }
                                    else if (data == "Buy") {
                                        return '<h4 class="text-navy" id=change_p_' + row[1] + '>' + data + '</h4>';      
                                    }
                                    else{
                                        return data;                   
                                    }
                                },
                                "targets": [2]
                            },
                            {
                                "render": function (data, type, row) {
                                    return data.toLocaleString('en-US');
                                },
                                "targets": [3, 5]
                            }
                        ]
            
                    });

                    $('select[name="insider-trading-table_length"]').css({"height":"3rem"});

                    //$("#insider-trading-table").css("width","100%")

                }

                if (response.insider_roaster_stats.length > 0) {

                    $('#li_insiders').removeClass('hidden');
                    $('#div-insider-trading-stats').removeClass('hidden');

                    let insider_roaster_stats = response.insider_roaster_stats;

                    $("#insider-trading-stats-table").dataTable().fnDestroy();
                    $('#insider-trading-stats-table').DataTable({
                        data: insider_roaster_stats,
                        pageLength: 50,
                        lengthMenu: [10, 25, 50, 100, 500],
                        responsive: true,
                        dom: '<"html5buttons"B>lTfgitp',
                        order: false,
                        buttons: [
                            { extend: 'copy', title: 'insider-trading-stats'},
                            {extend: 'csv', title: 'insider-trading-stats'},
                            {extend: 'excel', title: 'insider-trading-stats'},
                            {extend: 'pdf', title: 'insider-trading-stats'},
            
                            {extend: 'print',
                             customize: function (win){
                                    $(win.document.body).addClass('white-bg');
                                    $(win.document.body).css('font-size', '10px');
            
                                    $(win.document.body).find('table')
                                            .addClass('compact')
                                            .css('font-size', 'inherit');
                            }
                            }
                        ],
                        'columnDefs': [ 
                            {
                                "render": function (data, type, row) {
                                    if (data > 1)
                                    {
                                        return '<h4 class="text-navy" id=change_p_' + row[1] + '>' + data + '</h4>';
                                    }
                                    else{
                                        return '<h4 class="text-danger" id=change_p_' + row[1] + '>' + data + '</h4>';                
                                    }
                                },
                                "targets": [3]
                            },
                            {
                                "render": function (data, type, row) {
                                    return data.toLocaleString('en-US');
                                },
                                "targets": [4, 5]
                            }
                        ]
            
                    });

                    $('select[name="insider-trading-stats-table_length"]').css({"height":"3rem"});

                }

            }

            function checkerHolders(response) {

                if (response.total_shares_institutions > 0) {
                    $('#institutional-title').text('Top Institutional Holders - ' + response.total_shares_institutions + '%');
                }

                if (response.institutional_holder_list.length > 0) {

                    $('#li_holders').removeClass('hidden');
                    $('#div-institutional-holders').removeClass('hidden');

                    let institutional_holder_list = response.institutional_holder_list;
                    $("#institutional-holders-table").dataTable().fnDestroy();
                    $('#institutional-holders-table').DataTable({
                        data: institutional_holder_list,
                        pageLength: 10,
                        lengthMenu: [10, 25, 50, 100, 500],
                        responsive: true,
                        order: false,
                        buttons: [
                            { extend: 'copy', title: 'institutional-holders'},
                            {extend: 'csv', title: 'institutional-holders'},
                            {extend: 'excel', title: 'institutional-holders'},
                            {extend: 'pdf', title: 'institutional-holders'},
            
                            {extend: 'print',
                             customize: function (win){
                                    $(win.document.body).addClass('white-bg');
                                    $(win.document.body).css('font-size', '10px');
            
                                    $(win.document.body).find('table')
                                            .addClass('compact')
                                            .css('font-size', 'inherit');
                            }
                            }
                        ],
                        'columnDefs': [ 
                            {
                                "render": function (data, type, row) {
                                    if (row[5] > 1)
                                    {
                                        return '<h4 class="text-navy" id=' + row[1] + '>' + data + '</h4>';
                                    }
                                    else{
                                        return '<h4 class="text-danger" id=' + row[1] + '>' + data + '</h4>';                
                                    }
                                },
                                "targets": [3]
                            },
                            {
                                "render": function (data, type, row) {
                                    return data + '%';
                                },
                                "targets": [4]
                            },
                            {
                                "targets": [5],
                                "visible": false
                            }
                        ]
                    });

                    $('select[name="institutional-holders-table_length"]').css({"height":"3rem"});

                }

                if (response.mutual_fund_holder_list.length > 0) {

                    $('#li_holders').removeClass('hidden');
                    $('#div-mutual-funds-holders').removeClass('hidden');

                    let mutual_fund_holder_list = response.mutual_fund_holder_list;

                    $("#mutual-funds-holders-table").dataTable().fnDestroy();
                    $('#mutual-funds-holders-table').DataTable({
                        data: mutual_fund_holder_list,
                        pageLength: 10,
                        lengthMenu: [10, 25, 50, 100, 500],
                        responsive: true,
                        dom: '<"html5buttons"B>lTfgitp',
                        order: false,
                        buttons: [
                            { extend: 'copy', title: 'mutual-funds-holders'},
                            {extend: 'csv', title: 'mutual-funds-holders'},
                            {extend: 'excel', title: 'mutual-funds-holders'},
                            {extend: 'pdf', title: 'mutual-funds-holders'},
            
                            {extend: 'print',
                             customize: function (win){
                                    $(win.document.body).addClass('white-bg');
                                    $(win.document.body).css('font-size', '10px');
            
                                    $(win.document.body).find('table')
                                            .addClass('compact')
                                            .css('font-size', 'inherit');
                            }
                            }
                        ],
                        'columnDefs': [ 
                            {
                                "render": function (data, type, row) {
                                    if (row[5] > 1)
                                    {
                                        return '<h4 class="text-navy" id=' + row[1] + '>' + data + '</h4>';
                                    }
                                    else{
                                        return '<h4 class="text-danger" id=' + row[1] + '>' + data + '</h4>';                
                                    }
                                },
                                "targets": [3]
                            },
                            {
                                "render": function (data, type, row) {
                                    return data + '%';
                                },
                                "targets": [4]
                            },
                            {
                                "targets": [5],
                                "visible": false
                            }
                        ]
                    });

                    $('select[name="mutual-funds-holders-table_length"]').css({"height":"3rem"});

                }

            }

            function checkerDividends(response) {

                $('#ten_year_dividends_growth').html('0.00%');
                if (response.dividend_last_ten_years.length != 0) {
                    if(response.dividend_last_ten_years[response.dividend_last_ten_years.length - 1]['adjDividend'] != 0) {
                        $('#ten_year_dividends_growth').html((response.ten_year_dividends_growth).toFixed(2) + '%');
                    }
                    $('#dividend-amount').text(response.dividend_amount);
                    $('#ex-dividend-date').text(response.ex_dividend_date);
                    $('#dividend-payout-date').text(response.dividend_payout_date);

                    if (response.ex_dividend_date_coming) {
                        $('#dividends-coming').removeClass('hidden');
                        
                        toastr.options = {
                            "closeButton": false,
                            "debug": false,
                            "newestOnTop": false,
                            "progressBar": false,
                            "positionClass": "toast-top-right",
                            "preventDuplicates": false,
                            "onclick": null,
                            "showDuration": "3000",
                            "hideDuration": "1000",
                            "timeOut": "10000",
                            "extendedTimeOut": "1000",
                            "showEasing": "swing",
                            "hideEasing": "linear",
                            "showMethod": "fadeIn",
                            "hideMethod": "fadeOut"
                        };

                        toastr["info"]("The Ex-Dividend date for " + stock + " will be on " + response.ex_dividend_date, "Ex-Dividend date coming");
                    }

                    if (response.days_between_dividends && response.days_between_dividends != 0) {
                        if (response.days_between_dividends <= 40) {
                            $('#dividend-frequency').text('Monthly');
                        }
                        else if (response.days_between_dividends > 40 && response.days_between_dividends < 120) {
                            $('#dividend-frequency').text('Quarterly');
                        }
                        else {
                            $('#dividend-frequency').text('Annual');
                        }
                    }
                    else {
                        $('#dividend-frequency').text('Quarterly');
                    }
                }

                if (response.D1) {
                    next_year_dividend_original_val = response.D1.toFixed(2);
                }
                if (response.g) {
                    expected_dividend_growth_rate_original_val = (response.g*100).toFixed(2);
                }
                if (response.r) {
                    required_return_ddm_original_val = (response.r*100).toFixed(2)
                }

                if (followed_stocks.ddm_fair_value_data) {
                    if (followed_stocks.ddm_fair_value_data.next_year_dividend) {
                        $('#next_year_dividend').val(followed_stocks.ddm_fair_value_data.next_year_dividend);
                    }
                    if (followed_stocks.ddm_fair_value_data.expected_dividend_growth_rate) {
                        $('#expected_dividend_growth_rate').val(followed_stocks.ddm_fair_value_data.expected_dividend_growth_rate);
                    }
                    if (followed_stocks.ddm_fair_value_data.required_return_ddm) {
                        $('#required_return_ddm').val(followed_stocks.ddm_fair_value_data.required_return_ddm);
                    }
                    $('#required_return_ddm').trigger('change');
                }
                else if (response.fair_value_ddm < 0) {
                    $('#ddm_fair_value_tab').addClass('hidden');
                }
                else if (response.fair_value_ddm != "") {

                    $('#next_year_dividend').val(response.D1.toFixed(2));
                    $('#expected_dividend_growth_rate').val((response.g*100).toFixed(2));
                    $('#required_return_ddm').val((response.r*100).toFixed(2));

                    $('#ddm_fair_value').text(currency + (response.fair_value_ddm).toFixed(2));

                    let difference = ((response.fair_value_ddm - company_profile[0]['price']) / company_profile[0]['price']) * 100

                    $('#fair_value_difference_ddm').html(difference.toFixed(2) + '%');

                    if (difference >= 0){
                        $('#fair_value_difference_ddm').removeClass('text-danger');
                        $('#fair_value_difference_ddm').addClass('text-navy');
                    }
                    else {
                        $('#fair_value_difference_ddm').removeClass('text-navy');
                        $('#fair_value_difference_ddm').addClass('text-danger');
                    }

                }

                Morris.Line({
                    element: 'adjusted_dividends_chart',
                    data: response.dividend_last_ten_years,
                    xkey: 'date',
                    ykeys: ['adjDividend'],
                    labels: ['Adjusted Dividends'],
                    pointSize: 5,
                    hideHover: 'auto',
                    resize: true,
                    lineColors: ['#1ab394'],
                    lineWidth: 2,
                    yLabelFormat: function (y) {
                        return y = y.toFixed(2);
                    }
                });

                Morris.Line({
                    element: 'dividends_chart',
                    data: response.dividend_last_ten_years,
                    xkey: 'date',
                    ykeys: ['dividend'],
                    labels: ['Dividends'],
                    pointSize: 5,
                    hideHover: 'auto',
                    resize: true,
                    lineColors: ['#1ab394'],
                    lineWidth: 2,
                    yLabelFormat: function (y) {
                        return y = y.toFixed(2);
                    }
                });

                if (response.annual_dividends.length != 0) {

                    estimates_dividends = []
                    if (estimates['estimates_dividend'] != undefined) {
                        estimates_dividends = estimates['estimates_dividend']
                    }

                    annual_dividends = response.annual_dividends;
                    estimates_dividends_array = []
                    for(let i = 4; i >= 0; i--)
                    {
                        if (annual_dividends[i] == undefined || annual_dividends[i] == '0') {
                            estimates_dividends_array.push('-');
                        } else {
                            estimates_dividends_array.push((annual_dividends[i]['commonstockdividendspersharedeclared'] ? annual_dividends[i]['commonstockdividendspersharedeclared'] : annual_dividends[i]['commonstockdividendspersharecashpaid']));
                        }
                    } 

                    for (let i = 0; i < estimates_dividends.length; i++) {

                        if (estimates_dividends[i] == undefined || estimates_dividends[i] == '0') {
                            estimates_dividends_array.push('-');
                        } else {
                            estimates_dividends_array.push(parseFloat(estimates_dividends[i]).toFixed(2));
                        }

                    }
                    
                    estimates_dividends_percetage_array = [];

                    for (let i = 4; i >= 0; i--) {

                        if (financial_growth[i] == undefined) {
                            estimates_dividends_percetage_array.push(0);
                        } else {
                            estimates_dividends_percetage_array.push(financial_growth[i]['dividendsperShareGrowth']);
                        }

                    }

                    let dividends_next_5_years_percentage = 0;

                    for (let i = 5; i < estimates_dividends_array.length; i++) {

                        let estimates_dividends_array_temp = (estimates_dividends_array[i] - estimates_dividends_array[i - 1]) / estimates_dividends_array[i - 1];
                        
                        if (estimates_dividends_array[i - 1] == 0) {
                            estimates_dividends_array_temp = '-'
                        }
                        else {
                            if (estimates_dividends_array[i] > 0 && estimates_dividends_array[i - 1] > 0) {
                                estimates_dividends_array_temp = estimates_dividends_array_temp;
                            } else if (estimates_dividends_array[i] < 0 && estimates_dividends_array[i - 1] < 0) {
                                if (estimates_dividends_array[i] > estimates_dividends_array[i - 1] && estimates_dividends_array_temp < 0) {
                                    estimates_dividends_array_temp = estimates_dividends_array_temp * -1
                                } else if (estimates_dividends_array[i] < estimates_dividends_array[i - 1] && estimates_dividends_array_temp > 0) {
                                    estimates_dividends_array_temp = estimates_dividends_array_temp * -1
                                }
                            } else if (estimates_dividends_array[i] > 0 && estimates_dividends_array[i - 1] < 0 && estimates_dividends_array_temp < 0) {
                                estimates_dividends_array_temp = estimates_dividends_array_temp * -1
                            } else {
                                if (estimates_dividends_array[i] < estimates_dividends_array[i - 1] && estimates_dividends_array_temp > 0) {
                                    estimates_dividends_array_temp = estimates_dividends_array_temp * -1
                                }
                            }

                            dividends_next_5_years_percentage += estimates_dividends_array_temp
                        }

                        estimates_dividends_percetage_array.push(estimates_dividends_array_temp);

                    }

                    for (let i = 0; i < 10; i++) {

                        if(!estimates_dividends_array[i]) {

                            $('#dividend_estimates_tbody').append('<td>-</td>');
                            $('#dividend_estimates_percentage_tbody').append('<td>-</td>');

                        }
                        else{

                            if (estimates_dividends_array[i] == "-") {
                                $('#dividend_estimates_tbody').append('<td>-</td>');
                                $('#dividend_estimates_percentage_tbody').append('<td>-</td>');
                            }
                            else{

                                // Draw estimates revenues and revenues percentage in table
                                $('#dividend_estimates_tbody').append('<td><h3>' + parseFloat(estimates_dividends_array[i]).toLocaleString('en-US') + '</h3></td>');

                                if (estimates_dividends_percetage_array[i] == '-' || isNaN(estimates_dividends_percetage_array[i])){
                                    $('#dividend_estimates_percentage_tbody').append('<td><h5 class="text-navy">-</h5></td>');
                                }
                                else if (estimates_dividends_percetage_array[i] > 0) {
                                    $('#dividend_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + (estimates_dividends_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                                } else {
                                    $('#dividend_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + (estimates_dividends_percetage_array[i] * 100).toFixed(2) + '%' + '</h5></td>');
                                }

                            }
                        }

                    }

                    if (estimates_dividends.length > 0 && dividends_next_5_years_percentage) {
                        $('#dividend_estimates_tbody').append('<td></td>');
                        if(dividends_next_5_years_percentage > 0){
                            $('#dividend_estimates_percentage_tbody').append('<td><h5 class="text-navy">' + ((dividends_next_5_years_percentage/estimates_dividends.length)*100).toFixed(2) + '%</h5></td>');
                        }
                        else {
                            $('#dividend_estimates_percentage_tbody').append('<td><h5 class="text-danger">' + ((dividends_next_5_years_percentage/estimates_dividends.length)*100).toFixed(2) + '%</h5></td>');
                        }
                    }
                    else {
                        $('#dividend_estimates_percentage_tbody').append('<td><h5>-</h5></td>');
                    }

                    $('#estimate_table_id').DataTable({
                        "bSort": false,
                        "bPaginate": false,
                        "searching": false,
                        "bInfo" : false,
                        buttons: [
                            { extend: 'copy', title: 'estimates'},
                            {extend: 'csv', title: 'estimates'},
                            {extend: 'excel', title: 'estimates'},
                            {extend: 'pdf', title: 'estimates'},
            
                            {extend: 'print',
                             customize: function (win){
                                    $(win.document.body).addClass('white-bg');
                                    $(win.document.body).css('font-size', '10px');
            
                                    $(win.document.body).find('table')
                                            .addClass('compact')
                                            .css('font-size', 'inherit');
                            }
                            }
                        ],
                        dom: '<"html5buttons"B>lTfgitp',