import * as d3 from "d3";

export async function load_mouse_data() {
    let data = await d3.csv("./data/mouse_dna.csv");
    let float_dimensions = [
        'DYRK1A_N', 'ITSN1_N', 'BDNF_N', 'NR1_N', 'NR2A_N', 'pAKT_N', 'pBRAF_N', 'pCAMKII_N',
        'pCREB_N', 'pELK_N', 'pERK_N', 'pJNK_N', 'PKCA_N', 'pMEK_N', 'pNR1_N', 'pNR2A_N', 'pNR2B_N',
        'pPKCAB_N', 'pRSK_N', 'AKT_N', 'BRAF_N', 'CAMKII_N', 'CREB_N', 'ELK_N', 'ERK_N', 'GSK3B_N',
        'JNK_N', 'MEK_N', 'TRKA_N', 'RSK_N', 'APP_N', 'Bcatenin_N', 'SOD1_N', 'MTOR_N', 'P38_N',
        'pMTOR_N', 'DSCR1_N', 'AMPKA_N', 'NR2B_N', 'pNUMB_N', 'RAPTOR_N', 'TIAM1_N', 'pP70S6_N',
        'NUMB_N', 'P70S6_N', 'pGSK3B_N', 'pPKCG_N', 'CDK5_N', 'S6_N', 'ADARB1_N', 'AcetylH3K9_N',
        'RRP1_N', 'BAX_N', 'ARC_N', 'ERBB4_N', 'nNOS_N', 'Tau_N', 'GFAP_N', 'GluR3_N', 'GluR4_N',
        'IL1B_N', 'P3525_N', 'pCASP9_N', 'PSD95_N', 'SNCA_N', 'Ubiquitin_N', 'pGSK3B_Tyr216_N', 'SHH_N',
        'BAD_N', 'pS6_N', 'SYP_N', 'H3AcK18_N', 'EGR1_N', 'CaNA_N']
    let id_dimension = "MouseID"

    let row_filtered_data = data.filter(row => {
        for (const dim of float_dimensions) {
            if (row[dim] === "")
                return false
        }
        return true
    })

    let column_filtered_data = row_filtered_data.map(row => {
        let filtered_row = {}
        float_dimensions.forEach(dimension => filtered_row[dimension] = row[dimension])
        return filtered_row
    }).filter(e => e !== [])

    column_filtered_data.forEach(row => {
        float_dimensions.forEach(dimension => {
            row[dimension] = parseFloat(row[dimension])
        })
    })

    column_filtered_data.forEach((row, index) => {
        row["id"] = row_filtered_data[index][id_dimension]
    })

    return {
        data: column_filtered_data,
        dimensions: float_dimensions
    }
}

