({
    init: function(cmp, evt, helper) {
        var myPageRef = cmp.get("v.pageReference");
        var opportunityId = myPageRef.state.c__opportunityId;
        var equipmentSelection = myPageRef.state.c__equipmentSelection;
        cmp.set("v.opportunityId", opportunityId);
        cmp.set("v.equipmentSelection", equipmentSelection);
    },

    onPageReferenceChange: function(cmp, evt, helper) {
        var myPageRef = cmp.get("v.pageReference");
        var opportunityId = myPageRef.state.c__opportunityId;
        var equipmentSelection = myPageRef.state.c__equipmentSelection;
        cmp.set("v.opportunityId", opportunityId);
        cmp.set("v.equipmentSelection", equipmentSelection);
    }
});