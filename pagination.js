function getAggregationPipeline(matchStage, sortParameters, limit) {
    const sortStage = {
        _id: 1,
        ...sortParameters
    };

    return [
        {
            $match: matchStage
        },
        {
            $sort: sortStage
        },
        { $limit: limit },
        {
            $facet: {
                results: []
            }
        },
        {
            $addFields: {
                metadata: {
                    count: { $size: '$results' },
                    lastElement: {
                        $cond: {
                            if: { $eq: [{ $size: '$results' }, limit] },
                            then: {
                                $let: {
                                    vars: {
                                        lastElement: {
                                            $arrayElemAt: ['$results', -1]
                                        }
                                    },
                                    in: {
                                        _id: '$$lastElement._id',
                                        createdAt: '$$lastElement.createdAt'
                                    }
                                }
                            },
                            else: null
                        }
                    }
                }
            }
        }
    ];
}

module.exports = getAggregationPipeline;
